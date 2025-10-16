import { NextResponse } from "next/server";
import { db } from "../../../libs/database.js";
import { notificationManager } from "../../../libs/notification-service.js";

// This cron job endpoint manages automatic weekly competition lifecycle
// It runs once daily (midnight UTC) to:
// 1. Create upcoming weekly competitions
// 2. Activate competitions that have started
// 3. Complete competitions that have ended
// 4. Award winners

export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const results = {
      timestamp: now.toISOString(),
      created: [],
      activated: [],
      completed: [],
      errors: [],
    };

    // STEP 1: Create upcoming weekly competitions (next 8 weeks)
    try {
      const created = await createUpcomingWeeklyCompetitions();
      results.created = created;
    } catch (error) {
      console.error('Failed to create upcoming competitions:', error);
      results.errors.push({
        step: 'create',
        error: error.message,
      });
    }

    // STEP 2: Activate competitions whose start time has arrived
    try {
      const activated = await activateStartedCompetitions(now);
      results.activated = activated;
    } catch (error) {
      console.error('Failed to activate competitions:', error);
      results.errors.push({
        step: 'activate',
        error: error.message,
      });
    }

    // STEP 3: Complete competitions whose end time has passed
    try {
      const completed = await completeExpiredCompetitions(now);
      results.completed = completed;
    } catch (error) {
      console.error('Failed to complete competitions:', error);
      results.errors.push({
        step: 'complete',
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Competition cron job completed',
      results,
    });

  } catch (error) {
    console.error('Competition cron job error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper: Get next Monday at 00:00:00 PST (08:00 UTC)
function getNextMonday(fromDate = new Date()) {
  const date = new Date(fromDate);
  const day = date.getDay();
  
  // Calculate days until next Monday (0 = Sunday, 1 = Monday, etc.)
  const daysUntilMonday = day === 0 ? 1 : (8 - day);
  
  date.setDate(date.getDate() + daysUntilMonday);
  date.setUTCHours(8, 0, 0, 0); // 08:00 UTC = 00:00 PST
  
  return date;
}

// Helper: Get competition ID from date (format: YYYY-Www)
function getCompetitionId(date) {
  const year = date.getFullYear();
  
  // Calculate ISO week number
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
  
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

// Create upcoming weekly competitions (next 8 weeks)
async function createUpcomingWeeklyCompetitions() {
  const created = [];
  const now = new Date();
  
  for (let i = 0; i < 8; i++) {
    // Start from next Monday or current Monday if it's Monday and early
    let weekStart;
    if (i === 0) {
      // For the first week, check if we're currently in a Monday that hasn't started yet
      const currentDay = now.getDay();
      const currentHour = now.getUTCHours();
      
      if (currentDay === 1 && currentHour < 8) {
        // It's Monday before 8 AM UTC (midnight PST)
        weekStart = new Date(now);
        weekStart.setUTCHours(8, 0, 0, 0);
      } else {
        weekStart = getNextMonday(now);
      }
    } else {
      // For subsequent weeks, add 7 days from the previous week
      const baseMonday = i === 0 ? getNextMonday(now) : getNextMonday(now);
      weekStart = new Date(baseMonday);
      weekStart.setDate(baseMonday.getDate() + (i * 7));
    }
    
    // End is the following Monday at 07:59:59 UTC (23:59:59 Sunday PST)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setUTCHours(7, 59, 59, 999);
    
    const competitionId = getCompetitionId(weekStart);
    
    // Check if competition already exists
    const existing = await db.findOne('competitions', {
      competition_id: competitionId,
    });
    
    if (!existing) {
      try {
        await db.insertOne('competitions', {
          competition_id: competitionId,
          type: 'weekly',
          start_date: weekStart,
          end_date: weekEnd,
          timezone: 'PST',
          status: 'upcoming',
          total_submissions: 0,
          standard_submissions: 0,
          premium_submissions: 0,
          max_standard_slots: 15,
          max_premium_slots: 999,
          total_votes: 0,
          total_participants: 0,
          top_three_ids: [],
          theme: 'Weekly Launch Competition',
          description: 'Submit your AI project and compete for weekly recognition and backlinks!',
          prize_description: 'Top 3 projects get badges and dofollow backlinks',
        });
        
        created.push({
          competition_id: competitionId,
          start_date: weekStart.toISOString(),
          end_date: weekEnd.toISOString(),
        });
        
        console.log(`✅ Created competition: ${competitionId}`);
      } catch (error) {
        console.error(`Failed to create competition ${competitionId}:`, error);
      }
    }
  }
  
  return created;
}

// Activate competitions whose start time has arrived
async function activateStartedCompetitions(now) {
  const activated = [];
  
  try {
    // Find competitions that should be active now
    const competitionsToActivate = await db.find('competitions', {
      status: 'upcoming',
      start_date: { $lte: now },
      end_date: { $gt: now },
    });
    
    for (const competition of competitionsToActivate) {
      // Update competition status to active
      await db.updateOne(
        'competitions',
        { id: competition.id },
        {
          $set: {
            status: 'active',
          },
        }
      );
      
      // Activate any scheduled directories for this competition
      const activatedDirs = await activateScheduledDirectories(competition.competition_id);
      
      activated.push({
        competition_id: competition.competition_id,
        activated_directories: activatedDirs,
      });
      
      console.log(`✅ Activated competition: ${competition.competition_id}`);
    }
  } catch (error) {
    console.error('Error activating competitions:', error);
    throw error;
  }
  
  return activated;
}

// Activate scheduled directories for a competition
async function activateScheduledDirectories(competitionId) {
  try {
    // Find the competition by competition_id
    const competition = await db.findOne('competitions', {
      competition_id: competitionId,
    });
    
    if (!competition) {
      console.log(`Competition not found: ${competitionId}`);
      return 0;
    }
    
    // Find scheduled directories for this competition
    const scheduledDirs = await db.find('apps', {
      weekly_competition_id: competition.id,
      status: 'scheduled',
    });
    
    if (scheduledDirs.length === 0) {
      return 0;
    }
    
    // Activate them
    const result = await db.updateMany(
      'apps',
      {
        weekly_competition_id: competition.id,
        status: 'scheduled',
      },
      {
        $set: {
          status: 'live',
          published_at: new Date(),
          launched_at: new Date(),
        },
      }
    );
    
    console.log(`✅ Activated ${scheduledDirs.length} directories for ${competitionId}`);
    return scheduledDirs.length;
    
  } catch (error) {
    console.error(`Error activating directories for ${competitionId}:`, error);
    return 0;
  }
}

// Complete competitions whose end time has passed
async function completeExpiredCompetitions(now) {
  const completed = [];
  
  try {
    // Find active competitions that have ended
    const competitionsToComplete = await db.find('competitions', {
      type: 'weekly',
      status: 'active',
      end_date: { $lt: now },
    });
    
    for (const competition of competitionsToComplete) {
      // Award winners and update directories
      const winners = await awardWinners(competition);
      
      // Mark competition as completed
      await db.updateOne(
        'competitions',
        { id: competition.id },
        {
          $set: {
            status: 'completed',
            completed_at: now,
            top_three_ids: winners.map(w => w.id),
          },
        }
      );
      
      completed.push({
        competition_id: competition.competition_id,
        winners: winners.map(w => ({
          id: w.id,
          name: w.name,
          position: w.position,
          upvotes: w.upvotes,
        })),
      });
      
      console.log(`✅ Completed competition: ${competition.competition_id}`);
    }
  } catch (error) {
    console.error('Error completing competitions:', error);
    throw error;
  }
  
  return completed;
}

// Award winners for a completed competition
async function awardWinners(competition) {
  try {
    // Get all live directories in this competition, sorted by upvotes, then premium badge
    const directories = await db.find(
      'apps',
      {
        weekly_competition_id: competition.id,
        status: 'live',
      },
      {
        sort: { upvotes: -1, premium_badge: -1, created_at: -1 },
      }
    );
    
    if (directories.length === 0) {
      console.log(`No directories found for competition ${competition.competition_id}`);
      return [];
    }
    
    // Award top 3
    const winners = directories.slice(0, 3);
    const results = [];
    
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const position = i + 1;
      
      // Update directory with winner status
      await db.updateOne(
        'apps',
        { id: winner.id },
        {
          $set: {
            weekly_position: position,
            weekly_winner: true,
            dofollow_status: true,
            link_type: 'dofollow',
            dofollow_reason: 'weekly_winner',
            dofollow_awarded_at: new Date(),
            entered_weekly: false, // Remove from weekly display
          },
        }
      );
      
      results.push({
        ...winner,
        position,
      });
      
      console.log(`🏆 Position ${position}: ${winner.name} (${winner.upvotes} upvotes)`);

      // Send winner notification
      try {
        const user = await db.findOne('users', { id: winner.submitted_by });
        if (user && user.email) {
          await notificationManager.sendCompetitionWinnerNotification({
            userId: user.id,
            userEmail: user.email,
            directory: winner,
            competition: competition,
            position: position
          });
          console.log(`📧 Winner notification sent to ${user.email}`);
        }
      } catch (notificationError) {
        console.error(`Failed to send winner notification for ${winner.name}:`, notificationError);
      }
    }
    
    // Remove non-winners from weekly display
    if (directories.length > 3) {
      await db.updateMany(
        'apps',
        {
          weekly_competition_id: competition.id,
          status: 'live',
          weekly_winner: { $ne: true },
        },
        {
          $set: {
            entered_weekly: false,
          },
        }
      );
    }
    
    return results;
    
  } catch (error) {
    console.error(`Error awarding winners for ${competition.competition_id}:`, error);
    return [];
  }
}

