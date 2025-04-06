# Software Requirements Specification (SRS)

## **1. System Design**
The system is a **multi-page website** designed to introduce an energy healer’s services, provide essential information, and facilitate appointment booking. The system is structured to support **future enhancements** such as a custom booking system and blog functionality.

## **2. Architecture Pattern**
- The website follows a **Single Page Application (SPA)** approach.
- **Frontend:** Built with React and Next.js for server-side rendering and improved performance.
- **Backend:** Serverless/microservices architecture hosted on Vercel, allowing for scalable deployment and efficient API handling.

## **3. State Management**
- **Phase 1:** Minimal state management; primarily handled via UI interactions.
- **Phase 2:** Potential implementation of a database-driven backend to handle user sessions and admin logins.

## **4. Data Flow**
1. **User visits homepage** → Views introduction and service overview.
2. **User navigates to services page** → Reads detailed service descriptions.
3. **User clicks booking link** → Redirects to an embedded third-party booking service.
4. **User submits contact form** → Sends email notification to the healer.
5. **User explores FAQ & testimonials** → Reads static content.
6. **Future Phases:** Custom booking flow, user authentication, blog management.

## **5. Technical Stack**
### **Frontend**
- **Single Page Application (SPA)** using **React and Next.js** for optimized performance and server-side rendering.

### **Backend**
- **Serverless/microservices architecture** hosted on **Vercel** for seamless deployment and scaling.
- **Database (Phase 2):** PostgreSQL / MongoDB (for booking system and blog)
- **Authentication:** OAuth 2.0 or JWT-based authentication (if required for admin features)

## **6. Authentication Process (Phase 2)**
- No authentication required in Phase 1.
- Phase 2 will include:
  - Admin login for managing blog posts.
  - Secure authentication via OAuth 2.0 or email/password login.

## **7. Route Design**
- **/** → Homepage
- **/about** → About Page
- **/services** → Service Descriptions
- **/testimonials** → Testimonials Page
- **/faq** → FAQ Section
- **/contact** → Contact Form Page
- **/blog** *(Phase 2)* → Admin-managed blog page
- **/book** → Redirect to third-party booking service

## **8. API Design (Phase 2)**
### **Endpoints (Tentative)**
- **GET /services** → Fetch available services.
- **POST /contact** → Submit user inquiries.
- **POST /auth/login** → Authenticate admin user.
- **POST /blog** → Create a new blog post.
- **GET /blog** → Retrieve blog posts.

## **9. Database Design (ERD) (Phase 2)**
- **Users Table:** Stores admin credentials.
- **Services Table:** Holds service descriptions.
- **Bookings Table:** Stores user appointment details (if custom booking is implemented).
- **Blog Table:** Stores blog posts and timestamps.

---

This **Software Requirements Specification (SRS) Document** ensures that the technical architecture of the website aligns with the product vision while allowing for future scalability and enhancements.
