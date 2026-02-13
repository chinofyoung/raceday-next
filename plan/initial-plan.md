Help me plan for this project. I want you to create a plan and break it down to multiple stages. I want you to save each stage to a different file and save it inside /plan folder.


# Project Overview
I want to create an running events registration web app. This app will process registration and payment for running events. Majority of users are mobile. Design should be modern, minimalist, user-friendly and mobile-first.

# Tech
next.js
tailwindcss
firebase
cloudinary

# Pages
Homepage
    - Catchy landing page to show what the app is about
    - Entice users to sign up
    - Entice organizers to use this platform to host their events
    - It will show/highlight events
        - Upcoming events
        - Featured events
        - Events near you
For Organizers
    - This page is for the organizers
    - This is to entice organizers to use this platform to host their events
    - It will show/highlight benefits of using this platform
    - Show benefits for organizers
        - Easy to create events
        - Easy to manage events
        - Easy to manage participants
        - Easy to manage payments
Events
    - This page is for the runners
    - It will show/highlight events
        - Upcoming events
        - Featured events
        - Events near you
    - Highlight popular organizers
    - Highlight popular events
    - Search and filter events
About page
    - About the app
    - About the team
    - Contact us

# Things to note
- All forms should have an autosave feature
- Code must be of high quality and maintainable
- Componentize code well
- Use typescript

# Features
3 types of users: runner, organizer, admin

## Runner
- Accounts are created by logging in via google
- When users first time login, they will be asked to fill in their profile and there is a completion gauge
- When users register for events the form will be auto populated as needed
- Register for events
    - If an organizer allows, there is a "Vanity race number" option
        - Will allow user to input a custom number and pay an extra premium for this number depending on the orgnizer
        - Taken race number will be blocked (users have to check the number)
- Pay for events
- View runner dashboard
    - Name
    - Profile photo
    - Registered events
    - Past joined events
    - Settings
        - Edit profile
            - Name
            - Email
            - Phone
            - Address
            - Emergency contact
                - Name
                - Phone
                - Relationship
            - Medical conditions
            - T-shirt size
            - Singlet size
- Apply to be an organizer
    - Organizer name
    - Organizer contact email (can be different from runner email)
    - Organizer phone (can be different from runner phone)
- Logout

## Organizer
- View organizer dashboard
    - View events created
        - Delete events
        - Edit events
        - View participants
    - View past events created
    - Overview of events
    - Manage events
        - View revenue
        - Event tools
            - QR code scanning for participants claiming race kit
        - View participants
            - Registering users will have a QR code for race kit collection
            - Registering users will be automatically assigned a race number
                - Vanity race number will be assigned based on user input
                    - Vanity number will be appended after the distance category depending on the organizer's race number format
                        - Example: 42-001, 21-001, 42K-001, 42001, 21001
- Create events
    - Event name
    - Event date
    - Event location
    - Event description
    - Event image (Featured image + 5 gallery images)
    - Add vanity race number option
        - Enable/disable vanity race number
        - Set premium price for vanity race number
    - Event timeline
        - Activity
        - Description (optional)
        - Time
    - Event categories (Can create multiple distance categories)
        - Assembly time
        - Gun start time
        - Cut off time
        - Price
        - Category image (optional)
        - Route map (can upload .gpx file)
            - Map should be intercative
        - Inclusions
- Settings
    - Edit profile
        - Edit organizer details
- Logout

## Admin
*** Can you suggest other super admin functions? 
- View admin dashboard
- Accept organizer application
- View overall revenue stats
- View overall participant stas, by event, etc
- Manage users
- Manage events
- Manage organizers
- Logout