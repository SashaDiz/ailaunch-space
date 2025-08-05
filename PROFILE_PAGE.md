# Profile Page Documentation

## Overview

The Profile Page provides a comprehensive view of user profiles for authenticated users in the DirectoryHunt application. It displays user information, social media links, bio, and the projects they have launched.

## Features

### 1. Profile Information Display

- **User Avatar**: Shows user profile image with fallback to initials
- **Display Name**: User's full name
- **Location**: User's location (optional)
- **Join Date**: When the user joined the platform
- **Bio**: Short description about the user

### 2. Social Media Links

- **Website**: Personal or company website
- **Twitter**: Twitter profile link
- **GitHub**: GitHub profile link
- **LinkedIn**: LinkedIn profile link
- **Email**: Only visible to the profile owner

### 3. Statistics

- **Projects Launched**: Number of projects submitted
- **Total Views**: Aggregate views across all projects
- **Followers**: Number of users following this profile

### 4. Projects Section

- **Project Cards**: Display all projects launched by the user
- **Project Details**: Name, description, category, launch date, views, upvotes
- **Project Actions**: View details and visit website buttons

### 5. Profile Editing (Own Profile Only)

- **Edit Profile Dialog**: Modal for updating profile information
- **Editable Fields**:
  - Display name
  - Bio (500 character limit)
  - Location
  - Website URL
  - Social media usernames

## Routes

### Profile Routes

- `/profile` - Current user's profile (requires authentication)
- `/profile/:userId` - Specific user's profile (public)

## Components Used

### Main Components

- `ProfilePage.jsx` - Main profile page component
- `EditProfileDialog.jsx` - Profile editing modal

### UI Components

- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Layout structure
- `Avatar`, `AvatarImage`, `AvatarFallback` - User profile pictures
- `Button` - Action buttons
- `Badge` - Category and status indicators
- `Separator` - Visual dividers
- `Dialog` components - Edit profile modal
- `Input`, `Textarea`, `Label` - Form elements

## Development vs Production

### Development Mode

- Uses mock data for demonstration
- Simulates API calls with timeouts
- Profile editing updates local state only

### Production Mode

- Fetches real user data from `/api/users/:userId`
- Fetches user projects from `/api/users/:userId/projects`
- Profile updates saved via PATCH `/api/users/:userId`

## Required API Endpoints (Production)

### GET `/api/users/:userId`

Returns user profile data:

```json
{
  "id": "user-id",
  "name": "User Name",
  "email": "user@example.com",
  "image": "https://example.com/avatar.jpg",
  "bio": "User bio text",
  "location": "City, Country",
  "website": "https://website.com",
  "twitter": "username",
  "github": "username",
  "linkedin": "username",
  "joinedAt": "2024-01-15T00:00:00Z",
  "stats": {
    "projectsLaunched": 5,
    "totalViews": 15420,
    "followers": 234
  }
}
```

### GET `/api/users/:userId/projects`

Returns user's projects:

```json
[
  {
    "id": "project-id",
    "name": "Project Name",
    "description": "Project description",
    "category": "Category",
    "launchDate": "2024-06-15T00:00:00Z",
    "status": "live",
    "views": 5240,
    "upvotes": 89,
    "website": "https://project.com",
    "image": "https://example.com/project-image.jpg"
  }
]
```

### PATCH `/api/users/:userId`

Updates user profile (requires authentication):

```json
{
  "name": "Updated Name",
  "bio": "Updated bio",
  "location": "Updated Location",
  "website": "https://updated-website.com",
  "twitter": "updated-username",
  "github": "updated-username",
  "linkedin": "updated-username"
}
```

## Authentication Integration

### Session Context

The profile page integrates with the existing `SessionContext` to:

- Determine if user is viewing their own profile
- Access current user data
- Handle authentication state

### Header Integration

The header component has been updated to:

- Show user avatar and dropdown when authenticated
- Provide profile page navigation
- Include sign-out functionality

## Styling and Responsiveness

### Mobile-First Design

- Responsive grid layout (single column on mobile, two columns on desktop)
- Optimized for small screens
- Touch-friendly interaction elements

### Consistent Design System

- Uses existing Tailwind CSS classes
- Follows established color scheme and typography
- Maintains consistency with other pages

## Error Handling

### Loading States

- Skeleton loading for initial page load
- Loading indicators for profile updates
- Smooth transitions between states

### Error States

- Profile not found page
- Graceful handling of missing data
- Network error handling

## Future Enhancements

### Potential Features

1. **Profile Photo Upload**: Allow users to upload custom avatars
2. **Social Verification**: Verify social media accounts
3. **Follow System**: Allow users to follow each other
4. **Activity Feed**: Show recent user activity
5. **Project Analytics**: More detailed project statistics
6. **Profile Customization**: Themes and layout options

### Security Considerations

- Input validation and sanitization
- Rate limiting for profile updates
- Privacy controls for profile visibility
- Secure file upload for profile images
