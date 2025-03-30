# UI/UX Wireframes

## 1. Overview

This document outlines the user interface designs for the healing services booking system. It provides wireframes for each step of the booking process and admin dashboard using a minimalist, clean design approach that prioritizes simplicity and ease of use.

## 2. Design Principles

The interface design follows these key principles:

- **Minimalist Aesthetic**: Clean layouts with ample white space
- **Intuitive Navigation**: Clear visual hierarchy and straightforward user flows
- **Accessibility**: High contrast, readable typography, and keyboard navigation
- **Consistency**: Uniform design patterns across all screens
- **Responsive Design**: Adapts seamlessly to different devices and screen sizes

## 3. Color Palette & Typography

### 3.1 Color Palette

```
Primary:    #4F46E5 (Indigo)
Secondary:  #EC4899 (Pink)
Accent:     #10B981 (Emerald)
Background: #FFFFFF (White)
Surface:    #F9FAFB (Light Gray)
Text:       #111827 (Near Black)
Subtle:     #6B7280 (Gray)
Success:    #34D399 (Green)
Error:      #EF4444 (Red)
Warning:    #F59E0B (Amber)
```

### 3.2 Typography

```
Headings: Inter, sans-serif (600 weight)
Body: Inter, sans-serif (400 weight)
Buttons: Inter, sans-serif (500 weight)
```

## 4. Public Booking Interface Wireframes

### 4.1 Service Selection Screen

**Description**: The first step in the booking process where users select their desired service.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES                                 [Language Toggle]  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  BOOK AN APPOINTMENT                                                 |
|  ==================                                                  |
|                                                                      |
|  SELECT SERVICE                                                      |
|                                                                      |
|  +----------------------------------+  +---------------------------+ |
|  |                                  |  |                           | |
|  |  [  ] Energy Healing             |  |                           | |
|  |      75 min | 100€               |  |   Service Description     | |
|  |                                  |  |                           | |
|  +----------------------------------+  |   Details about the        | |
|                                        |   selected service will    | |
|  +----------------------------------+  |   appear here.            | |
|  |                                  |  |                           | |
|  |  [  ] Shiatsu                    |  |                           | |
|  |      75 min | 100€               |  |                           | |
|  |                                  |  +---------------------------+ |
|  +----------------------------------+                                |
|                                                                      |
|  +----------------------------------+                                |
|  |                                  |                                |
|  |  [  ] Reiki                      |                                |
|  |      75 min | 100€               |                                |
|  |                                  |                                |
|  +----------------------------------+                                |
|                                                                      |
|                                          [Continue →]                |
|                                                                      |
+----------------------------------------------------------------------+
```

### 4.2 Date Selection Screen

**Description**: Calendar view allowing users to select an available date for their appointment.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES                                 [Language Toggle]  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  BOOK AN APPOINTMENT: ENERGY HEALING                                 |
|  ===================================                                 |
|                                                                      |
|  1. Select Service  >  2. Choose Date  >  3. Choose Time  >  4. Your Info  |
|                                                                      |
|  SELECT DATE                                                         |
|                                                                      |
|  [◀ Previous Month]        May 2023         [Next Month ▶]          |
|                                                                      |
|  +---+---+---+---+---+---+---+                                      |
|  | M | T | W | T | F | S | S |                                      |
|  +---+---+---+---+---+---+---+                                      |
|  | 1 | 2 | 3 | 4 | 5 | 6 | 7 |                                      |
|  +---+---+---+---+---+---+---+                                      |
|  | 8 | 9 |10 |11 |12 |13 |14 |                                      |
|  +---+---+---+---+---+---+---+                                      |
|  |15 |16 |17 |18 |19 |20 |21 |                                      |
|  +---+---+---+---+---+---+---+                                      |
|  |22 |23 |24 |25 |26 |27 |28 |                                      |
|  +---+---+---+---+---+---+---+                                      |
|  |29 |30 |31 |   |   |   |   |                                      |
|  +---+---+---+---+---+---+---+                                      |
|                                                                      |
|                   ⓘ Available dates are highlighted                  |
|                   ⓘ Dates in gray are unavailable                    |
|                                                                      |
|  [← Back]                                         [Continue →]       |
|                                                                      |
+----------------------------------------------------------------------+
```

### 4.3 Time Slot Selection Screen

**Description**: Grid of available time slots for the selected date.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES                                 [Language Toggle]  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  BOOK AN APPOINTMENT: ENERGY HEALING                                 |
|  ===================================                                 |
|                                                                      |
|  1. Select Service  >  2. Choose Date  >  3. Choose Time  >  4. Your Info  |
|                                                                      |
|  SELECT TIME - MAY 15, 2023                                          |
|                                                                      |
|  Morning                                                             |
|  +---------------+  +---------------+  +---------------+             |
|  |               |  |               |  |               |             |
|  |    10:00      |  |    10:15      |  |    10:30      |             |
|  |               |  |               |  |               |             |
|  +---------------+  +---------------+  +---------------+             |
|                                                                      |
|  +---------------+  +---------------+  +---------------+             |
|  |               |  |               |  |               |             |
|  |    10:45      |  |    11:00      |  |    11:15      |             |
|  |               |  |               |  |               |             |
|  +---------------+  +---------------+  +---------------+             |
|                                                                      |
|  Afternoon                                                           |
|  +---------------+  +---------------+  +---------------+             |
|  |               |  |               |  |               |             |
|  |    13:00      |  |    13:15      |  |    13:30      |             |
|  |               |  |               |  |               |             |
|  +---------------+  +---------------+  +---------------+             |
|                                                                      |
|  ⓘ Each booking lasts 1 hour 15 minutes with a 15-minute buffer     |
|                                                                      |
|  [← Back]                                         [Continue →]       |
|                                                                      |
+----------------------------------------------------------------------+
```

### 4.4 Contact Information Form

**Description**: Form for collecting customer information to complete the booking.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES                                 [Language Toggle]  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  BOOK AN APPOINTMENT: ENERGY HEALING                                 |
|  ===================================                                 |
|                                                                      |
|  1. Select Service  >  2. Choose Date  >  3. Choose Time  >  4. Your Info  |
|                                                                      |
|  YOUR INFORMATION                                                    |
|                                                                      |
|  +--------------------------------------------------+                |
|  | Full Name *                                      |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  +--------------------------------------------------+                |
|  | Email Address *                                  |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  +--------------------------------------------------+                |
|  | Phone Number (optional)                          |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  +--------------------------------------------------+                |
|  | Preferred Language:  ○ Finnish  ○ English        |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  +--------------------------------------------------+                |
|  | Additional Notes (optional)                      |                |
|  |                                                  |                |
|  |                                                  |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  [← Back]                                     [Review Booking →]     |
|                                                                      |
+----------------------------------------------------------------------+
```

### 4.5 Booking Review & Confirmation

**Description**: Final step showing booking summary and confirmation button.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES                                 [Language Toggle]  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  BOOK AN APPOINTMENT: ENERGY HEALING                                 |
|  ===================================                                 |
|                                                                      |
|  1. Select Service  >  2. Choose Date  >  3. Choose Time  >  4. Your Info  |
|                                                                      |
|  REVIEW YOUR BOOKING                                                 |
|                                                                      |
|  +--------------------------------------------------+                |
|  |                                                  |                |
|  |  Service:    Energy Healing                      |                |
|  |  Date:       Monday, May 15, 2023                |                |
|  |  Time:       10:00 - 11:15                       |                |
|  |                                                  |                |
|  |  Name:       John Doe                            |                |
|  |  Email:      john@example.com                    |                |
|  |  Phone:      +358 50 123 4567                    |                |
|  |  Language:   English                             |                |
|  |                                                  |                |
|  |  Notes:      First time trying energy healing    |                |
|  |                                                  |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  By confirming this booking, you agree to our cancellation policy.   |
|  You may cancel up to 24 hours before your appointment.              |
|                                                                      |
|  [← Edit Details]                            [Confirm Booking]       |
|                                                                      |
+----------------------------------------------------------------------+
```

### 4.6 Booking Confirmation Screen

**Description**: Success screen after booking is confirmed.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES                                 [Language Toggle]  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|                          ✓                                           |
|                       CONFIRMED                                      |
|                                                                      |
|  Your appointment has been successfully booked!                      |
|                                                                      |
|  +--------------------------------------------------+                |
|  |                                                  |                |
|  |  Service:    Energy Healing                      |                |
|  |  Date:       Monday, May 15, 2023                |                |
|  |  Time:       10:00 - 11:15                       |                |
|  |                                                  |                |
|  |  Booking ID: ABC123                              |                |
|  |                                                  |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  A confirmation email has been sent to john@example.com              |
|  containing all details and a cancellation link.                     |
|                                                                      |
|  If you need to cancel or modify your booking, please use            |
|  the link in the email or contact us directly.                       |
|                                                                      |
|                       [Return to Homepage]                           |
|                                                                      |
+----------------------------------------------------------------------+
```

### 4.7 Cancellation Screen

**Description**: Interface for canceling an existing booking.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES                                 [Language Toggle]  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  CANCEL BOOKING                                                      |
|  ==============                                                      |
|                                                                      |
|  You are about to cancel the following appointment:                  |
|                                                                      |
|  +--------------------------------------------------+                |
|  |                                                  |                |
|  |  Service:    Energy Healing                      |                |
|  |  Date:       Monday, May 15, 2023                |                |
|  |  Time:       10:00 - 11:15                       |                |
|  |  Name:       John Doe                            |                |
|  |  Email:      john@example.com                    |                |
|  |                                                  |                |
|  |  Booking ID: ABC123                              |                |
|  |                                                  |                |
|  +--------------------------------------------------+                |
|                                                                      |
|  Are you sure you want to cancel this appointment?                   |
|  This action cannot be undone.                                       |
|                                                                      |
|                                                                      |
|  [← Keep My Booking]                       [Yes, Cancel Booking]     |
|                                                                      |
+----------------------------------------------------------------------+
```

## 5. Admin Dashboard Wireframes

### 5.1 Admin Login

**Description**: Secure login screen for admin access.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES - ADMIN                                            |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|                                                                      |
|                                                                      |
|                         ADMIN LOGIN                                  |
|                         ===========                                  |
|                                                                      |
|       +--------------------------------------------------+           |
|       | Email                                            |           |
|       +--------------------------------------------------+           |
|                                                                      |
|       +--------------------------------------------------+           |
|       | Password                                         |           |
|       +--------------------------------------------------+           |
|                                                                      |
|                       [Sign In with Clerk]                           |
|                                                                      |
|                                                                      |
|                                                                      |
+----------------------------------------------------------------------+
```

### 5.2 Admin Dashboard Overview

**Description**: Main dashboard showing upcoming bookings and quick stats.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES - ADMIN DASHBOARD              [Admin Name ▼]      |
|                                                                      |
+----------------------------------------------------------------------+
|                           |                                          |
|  [Dashboard]              |  OVERVIEW                                |
|  [Bookings]               |  ========                                |
|  [Availability]           |                                          |
|  [Services]               |  +-------------+  +-------------+        |
|  [Settings]               |  | TODAY       |  | THIS WEEK   |        |
|                           |  | 3 Bookings  |  | 12 Bookings |        |
|                           |  +-------------+  +-------------+        |
|                           |                                          |
|                           |  +---------------------------+           |
|                           |  | UPCOMING APPOINTMENTS     |           |
|                           |  +---------------------------+           |
|                           |  | Today - 10:00 | John Doe  |           |
|                           |  | Energy Healing          ▶ |           |
|                           |  +---------------------------+           |
|                           |  | Today - 13:00 | Jane Smith|           |
|                           |  | Shiatsu                 ▶ |           |
|                           |  +---------------------------+           |
|                           |  | Today - 15:30 | Alex Wong |           |
|                           |  | Reiki                   ▶ |           |
|                           |  +---------------------------+           |
|                           |                                          |
|                           |  +---------------------------+           |
|                           |  | QUICK ACTIONS             |           |
|                           |  +---------------------------+           |
|                           |  | [+ Add Booking]           |           |
|                           |  | [Block Date]              |           |
|                           |  | [Manage Availability]     |           |
|                           |  +---------------------------+           |
|                           |                                          |
+----------------------------------------------------------------------+
```

### 5.3 Bookings Calendar View

**Description**: Calendar interface showing all bookings with color coding.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES - ADMIN DASHBOARD              [Admin Name ▼]      |
|                                                                      |
+----------------------------------------------------------------------+
|                           |                                          |
|  [Dashboard]              |  BOOKING CALENDAR                        |
|  [Bookings]               |  ===============                         |
|  [Availability]           |                                          |
|  [Services]               |  [Day] [Week] [Month]   [May 2023 ▼]     |
|  [Settings]               |                                          |
|                           |  +---+---+---+---+---+---+---+           |
|                           |  | M | T | W | T | F | S | S |           |
|                           |  +---+---+---+---+---+---+---+           |
|                           |  | 1 | 2 | 3 | 4 | 5 | 6 | 7 |           |
|                           |  |███|   |███|   |███|   |   |           |
|                           |  |███|   |███|   |███|   |   |           |
|                           |  +---+---+---+---+---+---+---+           |
|                           |  | 8 | 9 |10 |11 |12 |13 |14 |           |
|                           |  |   |███|███|   |███|   |   |           |
|                           |  |   |███|███|   |███|   |   |           |
|                           |  +---+---+---+---+---+---+---+           |
|                           |  |15 |16 |17 |18 |19 |20 |21 |           |
|                           |  |███|   |███|   |███|   |   |           |
|                           |  |███|   |███|   |███|   |   |           |
|                           |  +---+---+---+---+---+---+---+           |
|                           |                                          |
|                           |  Legend:                                 |
|                           |  [███] Energy Healing                    |
|                           |  [███] Shiatsu                           |
|                           |  [███] Reiki                             |
|                           |  [///] Blocked Time                      |
|                           |                                          |
|                           |  [+ Add Booking]  [Export Calendar]      |
|                           |                                          |
+----------------------------------------------------------------------+
```

### 5.4 Booking Details Modal

**Description**: Detailed view of a specific booking with action buttons.

```
+----------------------------------------------------------------------+
|                                                                      |
|  +------------------------------------------------------------------+|
|  |                                                                  ||
|  |  BOOKING DETAILS                                        [✕]      ||
|  |  ==============                                                  ||
|  |                                                                  ||
|  |  SERVICE INFORMATION                                             ||
|  |  -------------------                                             ||
|  |  Service:    Energy Healing                                      ||
|  |  Date:       Monday, May 15, 2023                                ||
|  |  Time:       10:00 - 11:15                                       ||
|  |                                                                  ||
|  |  CUSTOMER INFORMATION                                            ||
|  |  --------------------                                            ||
|  |  Name:       John Doe                                            ||
|  |  Email:      john@example.com                                    ||
|  |  Phone:      +358 50 123 4567                                    ||
|  |  Language:   English                                             ||
|  |                                                                  ||
|  |  BOOKING DETAILS                                                 ||
|  |  --------------                                                  ||
|  |  Booking ID:  ABC123                                             ||
|  |  Status:      Confirmed                                          ||
|  |  Created:     May 10, 2023 at 15:30                              ||
|  |                                                                  ||
|  |  NOTES                                                           ||
|  |  -----                                                           ||
|  |  First time trying energy healing                                ||
|  |                                                                  ||
|  |  ADMIN NOTES (not visible to customer)                           ||
|  |  ------------------------------------                             ||
|  |  +------------------------------------------------+              ||
|  |  |                                                |              ||
|  |  |                                                |              ||
|  |  +------------------------------------------------+              ||
|  |  [Save Notes]                                                    ||
|  |                                                                  ||
|  |  [Edit Booking]  [Cancel Booking]  [Send Reminder Email]         ||
|  |                                                                  ||
|  +------------------------------------------------------------------+|
|                                                                      |
+----------------------------------------------------------------------+
```

### 5.5 Availability Management

**Description**: Interface for managing regular and special availability.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES - ADMIN DASHBOARD              [Admin Name ▼]      |
|                                                                      |
+----------------------------------------------------------------------+
|                           |                                          |
|  [Dashboard]              |  AVAILABILITY MANAGEMENT                 |
|  [Bookings]               |  ======================                  |
|  [Availability]           |                                          |
|  [Services]               |  [Regular Hours] [Special Dates] [Blocks]|
|  [Settings]               |                                          |
|                           |  REGULAR WEEKLY HOURS                    |
|                           |  -------------------                     |
|                           |                                          |
|                           |  Monday      [10:00] to [18:00]  [✓]     |
|                           |  Tuesday     [--:--] to [--:--]  [ ]     |
|                           |  Wednesday   [10:00] to [18:00]  [✓]     |
|                           |  Thursday    [--:--] to [--:--]  [ ]     |
|                           |  Friday      [10:00] to [18:00]  [✓]     |
|                           |  Saturday    [--:--] to [--:--]  [ ]     |
|                           |  Sunday      [--:--] to [--:--]  [ ]     |
|                           |                                          |
|                           |  APPLY CHANGES                           |
|                           |                                          |
|                           |  Start Date: [May 1, 2023      ]         |
|                           |  End Date:   [Dec 31, 2023     ] (Optional)|
|                           |                                          |
|                           |  [Update Regular Hours]                  |
|                           |                                          |
+----------------------------------------------------------------------+
```

### 5.6 Blocked Dates Management

**Description**: Interface for blocking specific dates.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES - ADMIN DASHBOARD              [Admin Name ▼]      |
|                                                                      |
+----------------------------------------------------------------------+
|                           |                                          |
|  [Dashboard]              |  AVAILABILITY MANAGEMENT                 |
|  [Bookings]               |  ======================                  |
|  [Availability]           |                                          |
|  [Services]               |  [Regular Hours] [Special Dates] [Blocks]|
|  [Settings]               |                                          |
|                           |  BLOCKED DATES                           |
|                           |  ------------                            |
|                           |                                          |
|                           |  +-----------------------------------+   |
|                           |  | Date        | Reason          | X |   |
|                           |  +-----------------------------------+   |
|                           |  | May 1, 2023 | Public Holiday   | ✕ |   |
|                           |  +-----------------------------------+   |
|                           |  | Jun 24, 2023| Personal Day     | ✕ |   |
|                           |  +-----------------------------------+   |
|                           |  | Dec 24-26,  | Christmas Holiday| ✕ |   |
|                           |  | 2023        |                  |   |   |
|                           |  +-----------------------------------+   |
|                           |                                          |
|                           |  ADD NEW BLOCKED DATE                    |
|                           |  --------------------                    |
|                           |                                          |
|                           |  Date: [Select date      ]               |
|                           |  Reason: [                ]              |
|                           |                                          |
|                           |  [Block This Date]                       |
|                           |                                          |
+----------------------------------------------------------------------+
```

### 5.7 Service Management

**Description**: Interface for managing service offerings.

```
+----------------------------------------------------------------------+
|                                                                      |
|  HEALING SERVICES - ADMIN DASHBOARD              [Admin Name ▼]      |
|                                                                      |
+----------------------------------------------------------------------+
|                           |                                          |
|  [Dashboard]              |  SERVICE MANAGEMENT                      |
|  [Bookings]               |  =================                       |
|  [Availability]           |                                          |
|  [Services]               |  +-----------------------------------+   |
|  [Settings]               |  | Service     | Duration | Status  | ⋮ | |
|                           |  +-----------------------------------+   |
|                           |  | Energy      | 75 min   | Active  | ⋮ | |
|                           |  | Healing     |          |         |   | |
|                           |  +-----------------------------------+   |
|                           |  | Shiatsu     | 75 min   | Active  | ⋮ | |
|                           |  +-----------------------------------+   |
|                           |  | Reiki       | 75 min   | Active  | ⋮ | |
|                           |  +-----------------------------------+   |
|                           |                                          |
|                           |  [+ Add New Service]                     |
|                           |                                          |
+----------------------------------------------------------------------+
|                                                                      |
|  +------------------------------------------------------------------+|
|  |                                                                  ||
|  |  EDIT SERVICE                                          [✕]       ||
|  |  ===========                                                     ||
|  |                                                                  ||
|  |  SERVICE INFORMATION                                             ||
|  |  -------------------                                             ||
|  |  Default Title:  [Energy Healing                    ]            ||
|  |  English Title:  [Energy Healing                    ]            ||
|  |  Finnish Title:  [Energiahoito                      ]            ||
|  |                                                                  ||
|  |  Default Description:                                            ||
|  |  [                                                  ]            ||
|  |  [                                                  ]            ||
|  |                                                                  ||
|  |  English Description:                                            ||
|  |  [                                                  ]            ||
|  |  [                                                  ]            ||
|  |                                                                  ||
|  |  Finnish Description:                                            ||
|  |  [                                                  ]            ||
|  |  [                                                  ]            ||
|  |                                                                  ||
|  |  Duration:     [75] minutes                                      ||
|  |  Price:        [100] €                                           ||
|  |  Color:        [#4F46E5]  [████]                                 ||
|  |  Display Order:[1]                                               ||
|  |                                                                  ||
|  |  ☑ Active (available for booking)                                ||
|  |                                                                  ||
|  |  [Cancel]                              [Save Changes]            ||
|  |                                                                  ||
|  +------------------------------------------------------------------+|
|                                                                      |
+----------------------------------------------------------------------+
```

## 6. Mobile View Wireframes

The booking system will be fully responsive. Below are key mobile interface examples showing how the design adapts to smaller screens.

### 6.1 Mobile Service Selection

```
+---------------------------+
| HEALING SERVICES    [≡]  |
+---------------------------+
|                           |
| BOOK AN APPOINTMENT       |
| ==================        |
|                           |
| SELECT SERVICE            |
|                           |
| +-------------------------+
| |                         |
| | [  ] Energy Healing     |
| |     75 min | 100€       |
| |                         |
| +-------------------------+
|                           |
| +-------------------------+
| |                         |
| | [  ] Shiatsu            |
| |     75 min | 100€       |
| |                         |
| +-------------------------+
|                           |
| +-------------------------+
| |                         |
| | [  ] Reiki              |
| |     75 min | 100€       |
| |                         |
| +-------------------------+
|                           |
| [Service Description]     |
|                           |
| [Continue →]              |
|                           |
+---------------------------+
```

### 6.2 Mobile Time Selection

```
+---------------------------+
| HEALING SERVICES    [≡]  |
+---------------------------+
|                           |
| BOOK: ENERGY HEALING      |
| ==================        |
|                           |
| 1 > 2 > 3 > 4             |
|                           |
| SELECT TIME - MAY 15      |
|                           |
| Morning                   |
| +--------+ +--------+     |
| |        | |        |     |
| | 10:00  | | 10:15  |     |
| |        | |        |     |
| +--------+ +--------+     |
|                           |
| +--------+ +--------+     |
| |        | |        |     |
| | 10:30  | | 10:45  |     |
| |        | |        |     |
| +--------+ +--------+     |
|                           |
| Afternoon                 |
| +--------+ +--------+     |
| |        | |        |     |
| | 13:00  | | 13:15  |     |
| |        | |        |     |
| +--------+ +--------+     |
|                           |
| [← Back]    [Continue →]  |
|                           |
+---------------------------+
```

## 7. Email Template Wireframes

### 7.1 Booking Confirmation Email

```
+--------------------------------------------------+
|                                                  |
|           HEALING SERVICES                       |
|                                                  |
+--------------------------------------------------+
|                                                  |
|           Booking Confirmation                   |
|                                                  |
|  Hello John,                                     |
|                                                  |
|  Your appointment has been confirmed!            |
|                                                  |
|  +------------------------------------------+    |
|  |                                          |    |
|  |  Service:    Energy Healing              |    |
|  |  Date:       Monday, May 15, 2023        |    |
|  |  Time:       10:00 - 11:15               |    |
|  |                                          |    |
|  |  Location:   Healing Center              |    |
|  |              Street Address 123          |    |
|  |              00100 Helsinki              |    |
|  |                                          |    |
|  +------------------------------------------+    |
|                                                  |
|  Please arrive 5-10 minutes before your          |
|  appointment time.                               |
|                                                  |
|  If you need to cancel or reschedule, please     |
|  click the link below:                           |
|                                                  |
|  [Cancel or Reschedule Appointment]              |
|                                                  |
|  We look forward to seeing you!                  |
|                                                  |
|  Best regards,                                   |
|  The Healing Services Team                       |
|                                                  |
+--------------------------------------------------+
```

## 8. Implementation Notes

### 8.1 Component Library

The UI will be implemented using Tailwind CSS and shadcn/ui component library with the following key components:

- Calendar component for date selection
- Time slot grid for appointment times
- Form inputs with validation
- Modal dialogs for confirmations
- Card components for service selection
- Button variants for primary/secondary actions

### 8.2 Responsive Breakpoints

```
Mobile:       < 640px
Tablet:       640px - 1024px
Desktop:      > 1024px
```

### 8.3 Accessibility Considerations

- All interactive elements will have appropriate aria labels
- Color contrast will meet WCAG AA standards
- Form fields will include proper labels and error states
- Focus states will be clearly visible for keyboard navigation
- All functionality will be available via keyboard

### 8.4 Animation Guidelines

Subtle animations will enhance the user experience:
- Smooth transitions between booking steps
- Gentle hover effects on interactive elements
- Loading indicators during API calls
- Fade-in effects when displaying new content 