import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb.js";
import { db } from "./database.js";
import { Resend } from "resend";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    EmailProvider({
      server: "smtp://placeholder",
      from: "noreply@resend.nomadlaunch.space",
      sendVerificationRequest: async ({ identifier: email, url, provider, theme }) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { error } = await resend.emails.send({
          from: provider.from,
          to: email,
          subject: "Sign in to Directory Hunt",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; font-size: 24px; margin-bottom: 10px;">Welcome to Directory Hunt</h1>
                <p style="color: #666; font-size: 16px;">Click the button below to sign in to your account</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Sign In to Directory Hunt
                </a>
              </div>
              
              <div style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                <p>If you didn't request this email, you can safely ignore it.</p>
                <p>This link will expire in 24 hours for security reasons.</p>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                <p>Directory Hunt - Launch Your Directory & Get DR22+ Backlinks</p>
              </div>
            </div>
          `,
          text: `Welcome to Directory Hunt!\n\nClick this link to sign in: ${url}\n\nIf you didn't request this email, you can safely ignore it.\nThis link will expire in 24 hours.`
        });

        if (error) {
          throw new Error(`Failed to send email: ${error.message}`);
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, token, user }) {
      // Ensure user has proper fields in our database
      if (session?.user?.email) {
        try {
          // Find or create user in our custom users collection
          let dbUser = await db.findOne("users", { email: session.user.email });
          
          if (!dbUser) {
            // Create new user record
            const newUser = {
              email: session.user.email,
              name: session.user.name || "",
              image: session.user.image || "",
              role: "user",
              subscription: "free",
              isActive: true,
              totalSubmissions: 0,
              totalVotes: 0,
              weeklyVotes: 0,
              monthlyVotes: 0,
              joinedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            const result = await db.insertOne("users", newUser);
            dbUser = { ...newUser, _id: result.insertedId };
          } else {
            // Update last login and profile info
            await db.updateOne(
              "users",
              { email: session.user.email },
              {
                $set: {
                  lastLoginAt: new Date(),
                  updatedAt: new Date(),
                  name: session.user.name || dbUser.name,
                  image: session.user.image || dbUser.image,
                },
              }
            );
          }
          
          // Add user ID and role to session
          session.user.id = dbUser._id.toString();
          session.user.role = dbUser.role;
          session.user.subscription = dbUser.subscription;
          session.user.totalSubmissions = dbUser.totalSubmissions;
          session.user.totalVotes = dbUser.totalVotes;
        } catch (error) {
          console.error("Session callback error:", error);
        }
      }
      return session;
    },
    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("User signed in:", user.email);
    },
    async signOut({ session, token }) {
      console.log("User signed out");
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};

const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
export const { GET, POST } = handlers;
export { auth, signIn, signOut };