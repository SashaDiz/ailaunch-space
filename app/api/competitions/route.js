import { NextResponse } from "next/server";
import { db } from "../../libs/database.js";

// GET /api/competitions - Get current and past competitions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'weekly' only
    const status = searchParams.get("status"); // 'active', 'completed', 'upcoming'
    const current = searchParams.get("current") === "true"; // Get current active competitions
    const available = searchParams.get("available"); // Get available weeks for submission
    const plan = searchParams.get("plan"); // Plan type for slot checking

    let filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (status) {
      filter.status = status;
    }

    // If requesting current competitions, get active ones
    if (current) {
      // First, update expired competitions to completed status
      await updateExpiredCompetitions();
      
      // For homepage, we want the current active competition to show time remaining
      const now = new Date();
      
      // Get the current weekly competition (active) or next upcoming weekly competition
      let currentWeekly = await db.findOne("competitions", {
        type: "weekly",
        status: "active"
      });
      
      // If no active weekly competition, get the next upcoming one
      if (!currentWeekly) {
        currentWeekly = await db.findOne("competitions", {
          type: "weekly",
          status: "upcoming",
          start_date: { $gt: now }
        }, {
          sort: { start_date: 1 } // Earliest first
        });
      }
      
      const competitions = currentWeekly ? [currentWeekly] : [];
      
      // Calculate time remaining for competitions
      const competitionsWithTimeLeft = competitions.map(comp => {
        let timeLeft = null;
        
        const now = new Date();
        const endTime = new Date(comp.end_date);
        const startTime = new Date(comp.start_date);
        
        // For future competitions, show time until start
        // For active competitions, show time until end
        const targetTime = startTime > now ? startTime : endTime;
        const timeDiff = targetTime - now;
        
        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          
          timeLeft = { days, hours, minutes, seconds, totalMs: timeDiff };
        }
        
        return {
          ...comp,
          timeLeft,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          competitions: competitionsWithTimeLeft,
          currentTime: new Date().toISOString(),
        },
      });
    }

    // Handle available weeks request for submission
    if (available === "true") {
      const now = new Date();
      
      // Create upcoming weeks if they don't exist
      await createUpcomingWeeks();
      
      // Get upcoming weekly competitions (including current week if it's not over)
      // Users can submit to any week that hasn't ended yet (active or upcoming)
      const upcomingWeeks = await db.find(
        "competitions",
        {
          type: "weekly",
          status: { $in: ["active", "upcoming"] },
          end_date: { $gt: now }, // Week hasn't ended yet
        },
        {
          sort: { start_date: 1 }, // Earliest first
          limit: 8 // Show next 8 weeks
        }
      );

      // Filter weeks based on plan availability
      // Standard plan: can only use first 15 slots (shared with premium)
      // Premium plan: can use all 25 slots (15 shared + 10 extra)
      let availableWeeks = upcomingWeeks;
      
      if (plan) {
        availableWeeks = upcomingWeeks.filter(week => {
          const totalUsed = week.total_submissions || 0;
          
          if (plan === "premium") {
            // Premium can submit if total submissions < 25
            return totalUsed < 25;
          } else {
            // Standard can submit if total submissions < 15
            return totalUsed < 15;
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          weeks: availableWeeks,
          currentTime: new Date().toISOString(),
        },
      });
    }


    const competitions = await db.find(
      "competitions", 
      filter,
      { 
        sort: { start_date: -1 } // Most recent first
      }
    );

    // Calculate time remaining for active competitions
    const competitionsWithTimeLeft = competitions.map(comp => {
      let timeLeft = null;
      
      if (comp.status === "active") {
        const now = new Date();
        const endTime = new Date(comp.end_date);
        const timeDiff = endTime - now;
        
        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          
          timeLeft = { days, hours, minutes, seconds, totalMs: timeDiff };
        }
      }
      
      return {
        ...comp,
        timeLeft,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        competitions: competitionsWithTimeLeft,
        currentTime: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Competitions API error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      url: request.url
    });
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : error.message
      },
      { status: 500 }
    );
  }
}

// Helper function to get next Monday start
function getNextMondayStart() {
  const now = new Date();
  const nextMonday = new Date(now);
  
  // Calculate days to next Monday
  const daysToMonday = (1 + 7 - now.getDay()) % 7;
  if (daysToMonday === 0 && now.getHours() >= 0) {
    // It's Monday but past midnight, get next Monday
    nextMonday.setDate(now.getDate() + 7);
  } else {
    nextMonday.setDate(now.getDate() + daysToMonday);
  }
  
  // Set to 12:00 AM PST (Pacific Standard Time = UTC-8)
  nextMonday.setHours(8, 0, 0, 0); // 8 AM UTC = 12 AM PST
  
  return nextMonday;
}

// Helper function to create upcoming weekly competitions
// Ensures there are always at least 5 months (20 weeks) of available launch weeks
async function createUpcomingWeeks() {
  const now = new Date();
  const weeksToEnsure = 20; // Always maintain 5 months (20 weeks) of available launch weeks
  
  // Check how many upcoming/active weeks already exist
  const existingUpcomingWeeks = await db.count("competitions", {
    type: "weekly",
    status: { $in: ["active", "upcoming"] },
    start_date: { $gte: now }
  });
  
  console.log(`Found ${existingUpcomingWeeks} existing upcoming weeks`);
  
  // Calculate how many weeks we need to create
  const weeksToCreate = Math.max(weeksToEnsure - existingUpcomingWeeks, 0);
  
  if (weeksToCreate === 0) {
    console.log('Sufficient upcoming weeks already exist');
    return;
  }
  
  console.log(`Creating ${weeksToCreate} new upcoming weeks`);
  
  // Find the latest week in the database to continue from there
  const latestWeek = await db.findOne("competitions", {
    type: "weekly"
  }, {
    sort: { start_date: -1 }
  });
  
  let startFromWeek = 0;
  if (latestWeek) {
    // Calculate how many weeks from next Monday the latest week is
    const nextMonday = getNextMondayStart();
    const weeksDiff = Math.floor((new Date(latestWeek.start_date) - nextMonday) / (7 * 24 * 60 * 60 * 1000));
    startFromWeek = weeksDiff + 1;
  }
  
  for (let i = startFromWeek; i < startFromWeek + weeksToCreate; i++) {
    const weekStart = new Date(getNextMondayStart());
    weekStart.setDate(weekStart.getDate() + (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(7, 59, 59, 999); // End at 11:59:59 PM Sunday PST (7:59 AM Monday UTC)
    
    // Generate week number and competition ID
    const year = weekStart.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((weekStart - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const competitionId = `${year}-W${String(weekNumber).padStart(2, "0")}`;
    
    // Check if competition already exists
    const existing = await db.findOne("competitions", { 
      competition_id: competitionId 
    });
    
    if (!existing) {
      const weeklyCompetition = {
        competition_id: competitionId,
        type: "weekly",
        start_date: weekStart,
        end_date: weekEnd,
        timezone: "PST",
        status: "upcoming", // All competitions start as upcoming, updated to active when start_date arrives
        total_submissions: 0,
        standard_submissions: 0,
        premium_submissions: 0,
        max_standard_slots: 15, // Shared slots for both standard and premium
        max_premium_slots: 25, // Total slots available for premium (15 shared + 10 extra)
        total_votes: 0,
        total_participants: 0,
        top_three_ids: [],
        theme: "Weekly Launch Competition",
        description: "Submit your AI project and compete for weekly recognition and backlinks!",
        prize_description: "Top 3 AI projects get badges and dofollow backlinks",
        // Note: created_at and updated_at are automatically set by database triggers
      };
      
      await db.insertOne("competitions", weeklyCompetition);
      console.log(`Created weekly competition: ${competitionId}`);
    }
  }
}

// Helper function to update expired competitions
async function updateExpiredCompetitions() {
  const now = new Date();
  
  try {
    // Find expired weekly competitions that need processing
    const expiredWeekly = await db.find("competitions", {
      type: "weekly",
      status: "active",
      end_date: { $lt: now }
    });
    
    // Process each expired weekly competition (award winners, etc.)
    for (const competition of expiredWeekly) {
      await processExpiredCompetition(competition); // Pass the entire competition object
    }
    
    // Update weekly competitions that have ended
    await db.updateMany(
      "competitions",
      {
        type: "weekly",
        status: "active",
        end_date: { $lt: now }
      },
      {
        $set: {
          status: "completed"
          // updated_at is automatically set by database trigger
        }
      }
    );
    
    
    // Update upcoming competitions to active if their start time has arrived
    const newlyActivatedCompetitions = await db.find("competitions", {
      status: "upcoming",
      start_date: { $lte: now },
      end_date: { $gt: now }
    });

    await db.updateMany(
      "competitions",
      {
        status: "upcoming",
        start_date: { $lte: now },
        end_date: { $gt: now }
      },
      {
        $set: {
          status: "active"
          // updated_at is automatically set by database trigger
        }
      }
    );

    // CRITICAL: Activate directories when their launch week becomes active
    for (const competition of newlyActivatedCompetitions) {
      await activateDirectoriesForCompetition(competition); // Pass the entire competition object
    }
    
    console.log("Competition statuses updated");
  } catch (error) {
    console.error("Failed to update competition statuses:", error);
  }
}

// Process expired competition (award winners and update directories)
async function processExpiredCompetition(competition) {
  try {
    console.log(`Auto-processing expired competition: ${competition.competition_id}`);
    
    // Get all directories in this competition sorted by votes
    const directories = await db.find("apps", {
      weekly_competition_id: competition.id, // UUID reference
      status: "live"
    }, {
      sort: { upvotes: -1 }
    });
    
    if (directories.length === 0) {
      console.log(`No directories found for competition ${competition.competition_id}`);
      return;
    }
    
    // Award winners (top 3)
    const winners = directories.slice(0, 3);
    const winnerIds = winners.map(d => d.id);
    
    // Award winner badges and dofollow links
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const position = i + 1;
      
      // Check if already processed
      const existing = await db.findOne("apps", { 
        id: winner.id, 
        weekly_position: { $exists: true } 
      });
      
      if (!existing) {
        console.log(`Auto-awarding position ${position} to ${winner.name}`);
        
        await db.updateOne("apps",
          { id: winner.id },
          {
            $set: {
              weekly_position: position,
              weekly_winner: true,
              dofollow_links_earned: (winner.dofollow_links_earned || 0) + 1,
              link_status: "dofollow"
              // updated_at is automatically set by database trigger
            }
          }
        );
      }
    }
    
    // Remove directories from weekly display
    await db.updateMany("apps",
      { 
        weekly_competition_id: competition.id, // UUID reference
        weekly_competition_ended: { $ne: true }
      },
      {
        $set: {
          entered_weekly: false,
          weekly_competition_ended: true
          // updated_at is automatically set by database trigger
        }
      }
    )
    
    console.log('Expired competition processed automatically', { competitionId: competition.competition_id });
    
  } catch (error) {
    console.error('Failed to process expired competition:', { competitionId: competition.competition_id, error });
  }
}

// Function to activate scheduled directories when their launch week starts
async function activateDirectoriesForCompetition(competition) {
  try {
    console.log(`Activating scheduled directories for competition: ${competition.competition_id}`);
    
    // Find all scheduled directories for this weekly competition
    const scheduledDirectories = await db.find("apps", {
      weekly_competition_id: competition.id, // UUID reference
      status: "scheduled"
    });
    
    console.log(`Found ${scheduledDirectories.length} scheduled directories for ${competition.competition_id}`);
    
    if (scheduledDirectories.length === 0) {
      return;
    }
    
    // Activate directories: scheduled -> live
    const result = await db.updateMany("apps",
      { 
        weekly_competition_id: competition.id, // UUID reference
        status: "scheduled"
      },
      {
        $set: {
          status: "live",
          published_at: new Date(),
          launched_at: new Date()
          // updated_at is automatically set by database trigger
        }
      }
    );
    
    console.log(`✅ Activated ${result.modifiedCount} directories for competition ${competition.competition_id}`);
    
  } catch (error) {
    console.error('Failed to activate directories for competition:', { competitionId: competition.competition_id, error });
  }
}