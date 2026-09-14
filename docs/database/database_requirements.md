# **Soundwaves Sprint 1 Database Requirements** 

## **1. Purpose** 

The purpose of this document is to define the database requirements for the first implementation sprint of the Soundwaves application. 

Soundwaves is designed as a client-server music streaming application that supports both hosted and self-hosted deployments. The database serves as the persistent storage layer for the application and will be accessed only through the backend server. 

The goal of Sprint 1 is to establish a clear and implementable database foundation that supports the core music catalog and account data required by future backend, authentication, search, streaming, playlist, and analytics features. 

## **2. Sprint 1 Database Scope** 

During Sprint 1, the database work will focus on designing and preparing the core data structures required by Soundwaves. 

The primary database areas included in this sprint are: 

- Music catalog data 

- Artist information 

- Album information 

- Track information 

- Genre information 

- Audio file references 

- Album artwork references 

- User account data 

- User roles and access information 

- Authentication-related storage requirements 

Sprint 1 will also identify future database requirements so the initial schema can be designed without preventing later expansion. 

## **3. Core Music Catalog Requirements** 

The database must support storage and retrieval of music metadata. 

At minimum, the database must be capable of representing: 

### **Artists** 

The database must store information that uniquely identifies an artist. 

Required information should include: 

- Unique artist identifier 

- Artist name 

The design should allow one artist to be associated with multiple albums and tracks. 

### **Albums** 

The database must store album information. 

Required information should include: 

- Unique album identifier 

- Album title 

- Associated artist 

- Album artwork reference 

- Release information when available 

An album must be capable of containing multiple tracks. 

### **Tracks** 

The database must store metadata for individual music tracks. 

Required information should include: 

- Unique track identifier 

- Track title 

- Associated artist 

- Associated album when applicable 

- Track number when applicable 

- Duration 

- Genre association 

- Audio file reference 

- Availability status where needed 

The database should allow tracks to be searched and retrieved individually without loading the complete music catalog. 

### **Genres** 

The database must support music genres so tracks can be categorized and searched. 

At minimum, each genre should have: 

- Unique genre identifier 

- Genre name 

The design should allow a track to be associated with one or more genres if the team chooses to support multiple genre assignments. 

## **4. Audio File Requirements** 

Soundwaves must be able to associate track metadata with the actual music file that will later be streamed by the backend. 

The database should therefore store a reference to the audio file rather than exposing the physical file directly to the client. 

Audio-related metadata may include: 

- File location or storage identifier 

- File name 

- File type or media type 

- File size 

- Codec when required 

- Availability status 

The database must not require the frontend client to know the physical location of audio files on the server. 

The backend will be responsible for translating database information into authorized streaming responses. 

## **5. Album Artwork Requirements** 

The system must support album artwork. 

The database should store metadata or references that allow the backend to locate the correct artwork for albums or tracks. 

Artwork-related data may include: 

- Unique artwork identifier 

- Storage location or object reference 

- Media type 

- Associated album 

- Associated track when required 

Artwork should not need to be stored directly inside the database unless the team intentionally selects that design. 

## **6. User Account Requirements** 

The database must support persistent user accounts. 

At minimum, each user account should be capable of storing: 

- Unique user identifier 

- Username 

- Email address where applicable 

- Password hash 

- Account role 

- Account status 

- Account creation timestamp 

- Account modification timestamp 

The database must never store plaintext passwords. 

Usernames should be unique. 

Email addresses should also be unique if email is used as part of the Soundwaves account system. 

The schema should support at least two account roles: 

- Standard user 

- Administrator 

The administrator role will later be used by the backend to authorize management operations. 

## **7. Authentication and Access Requirements** 

The database must be structured so the future authentication system can verify users and enforce permissions. 

Authentication-related database requirements include: 

- Password hashes must be stored securely. 

- Plaintext passwords must not be stored. 

- Users must have an associated access level or role. 

- Disabled or inactive accounts must be representable. 

- Token or session information must be supported if the backend implementation chooses to persist it. 

- Token expiration must be representable if tokens are stored. 

- Authentication-related data must not be directly accessible by clients. 

The Soundwaves specification describes authentication tokens, user and administrator roles, and secure password handling. The exact token storage implementation remains dependent on the backend technology selected by the group. 

## **8. Search Requirements** 

Soundwaves requires users to search for tracks, artists, and albums. 

The database design must therefore support efficient lookup using at least: 

- Track title 

- Artist name 

- Album title 

- Genre 

The schema must also support returning limited result sets instead of retrieving the entire catalog. 

This is necessary to support pagination, lazy loading, and large self-hosted music libraries. 

The database design should therefore allow the backend to request results using limits, offsets, cursors, or another approved pagination strategy. 

## **9. Scalability Requirements** 

The database should support music libraries containing hundreds or thousands of tracks without requiring the entire catalog to be loaded into memory. 

The schema should: 

- Use normalized relationships where appropriate. 

- Define indexes for frequently searched fields. 

- Index important foreign-key relationships where appropriate. 

- Support bounded or paginated queries. 

- Avoid unnecessary duplication of large metadata values. 

- Allow future database expansion without redesigning the core music catalog. 

The initial schema should be suitable for both small self-hosted installations and larger hosted catalogs. 

## **10. Security Requirements** 

Database access must follow the client-server architecture defined for Soundwaves. 

The frontend must not connect directly to the database. 

The communication path must follow this model: 

Client → Backend/API → Database 

The backend server is the only application component permitted to directly read or modify database records. 

Database credentials must not be: 

- Embedded in frontend code 

- Committed to GitHub 

- Stored directly in source files 

Credentials should be supplied using environment configuration or another secure configuration method. 

Sensitive data such as password hashes and authentication information must not be returned through normal catalog queries. 

## **11. Data Integrity Requirements** 

The database must protect data integrity using appropriate constraints. 

The schema should include: 

- Primary keys 

- Foreign keys 

- Required-field constraints 

- Unique constraints 

- Appropriate delete behavior 

- Valid default values where needed 

Examples include: 

- A track cannot reference an album that does not exist. 

- A duplicate username cannot be created. 

- A track duration cannot contain an invalid negative value. 

- Required track information cannot be null. 

- A relationship table should not contain duplicate relationships unless duplicates are intentionally supported. 

Deletion behavior must be explicitly defined. 

Possible strategies include: 

- Cascade deletion 

- Restrict deletion 

- Soft deletion 

- Setting selected references to null 

The selected behavior should be documented for each important relationship. 

## **12. Future Database Requirements** 

The following data areas are required or discussed by the overall Soundwaves specification but are not part of the primary Sprint 1 implementation. 

They should be considered during schema design but can be implemented during later sprints. 

### **Playlists** 

Future support will be needed for: 

- Playlist ownership 

- Playlist names 

- Playlist tracks 

- Track ordering 

- Playlist modification 

### **Favorites** 

Future support may include: 

- Favorite tracks 

- Favorite albums 

- Favorite artists 

### **Playback History** 

Future playback functionality will require storage for information such as: 

- User 

- Track 

- Playback timestamp 

- Playback event type 

- Completion status 

### **Recently Played** 

The database will eventually need to support retrieving a user's recently played tracks. 

### **Application Settings** 

Future support may include: 

- User preferences 

- Audio quality settings 

- Language settings 

- Storage preferences 

### **Analytics** 

The statistics dashboard will eventually require playback and usage data that can be aggregated by the backend. 

## **13. Out of Scope for Sprint 1** 

The following features are not part of my Sprint 1 database implementation: 

- Backend API endpoint implementation 

- Login endpoint implementation 

- Token generation 

- Password verification logic 

- Frontend development 

- Music streaming 

- Audio transcoding 

- Playback controls 

- Statistics dashboard implementation 

- Recommendation algorithms 

- Client-side caching 

The database may include structures that will support these features later, but these application features will not be implemented as part of this database-only sprint. 

## **14. Sprint 1 Database Deliverables** 

By the end of Sprint 1, the database work should produce: 

1. Database requirements document 

2. Database technology decision 

3. Initial entity-relationship diagram 

4. Data dictionary 

5. Reproducible local database environment 

6. Version-controlled migration configuration 

7. Initial music catalog schema 

8. Initial user/access schema 

9. Required database indexes 

10. Development seed data 

11. Database validation and test evidence 

12. Database setup and usage documentation 

## **15. Sprint 1 Success Criteria** 

Sprint 1 database work will be considered successful when: 

- The required Soundwaves data has been identified. 

- Core catalog entities and relationships are clearly defined. 

- Core user and access entities are clearly defined. 

- Future database functionality has been identified without being unnecessarily implemented. 

- The database design supports future search, authentication, streaming, playlist, and analytics functionality. 

- The schema is protected by appropriate constraints. 

- The design supports large catalogs through bounded queries and indexing. 

- The database can only be accessed through the backend architecture. 

- Database setup can be reproduced by other team members. 

- The database design and implementation are documented in the project repository. 

## **16. Open Decisions** 

The following decisions must be confirmed by the team before or during implementation: 

- Database management system - postgreSQL 

- Database version - latest long supported version 

- ORM or direct-query approach - orm 

- Migration framework - orm 

- Identifier type - BIGINT 

- Whether a track can have multiple artists - yes 

- Whether an album can have multiple artists - yes many to many 

- Whether tracks can have multiple genres - no 

- Whether authentication tokens will be persisted - persist 

- Whether media and artwork paths will be stored as filesystem paths, object identifiers, or another storage reference - relative path 

- Whether deletion will use physical deletion or soft deletion for major entities - mixed 

- Exact pagination strategy - keyset 

- Exact timestamp and time-zone convention - UTC + client-side display conversion 

These decisions should be documented rather than assumed during implementation. 

