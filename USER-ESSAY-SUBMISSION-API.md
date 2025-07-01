# 📝 User Essay Submission API Documentation

## Overview
The User Essay Submission system allows users to submit essays for review and potential publication on the Possue Legal Education platform. It includes file upload capabilities, admin moderation workflow, and email notifications.

## Content Type: UserEssaySubmission

### Schema
```json
{
  "title": "string (required, max 255 chars)",
  "content": "richtext (required)",
  "submissionType": "enum ['essay', 'practice-question', 'case-study', 'analysis']",
  "subject": "relation to Subject",
  "submitterName": "string (required, max 100 chars)",
  "submitterEmail": "email (required)",
  "submitterYear": "enum ['1L', '2L', '3L', 'Graduate', 'Attorney', 'Other']",
  "lawSchool": "string (max 200 chars)",
  "graduationYear": "integer (1900-2050)",
  "attachments": "media (multiple files/images)",
  "status": "enum ['pending', 'under-review', 'approved', 'rejected', 'needs-revision']",
  "moderationNotes": "text (private)",
  "reviewedBy": "relation to Admin User (private)",
  "reviewedAt": "datetime (private)",
  "rejectionReason": "enum ['inappropriate-content', 'poor-quality', 'duplicate', 'off-topic', 'copyright-violation', 'other']",
  "rejectionDetails": "text",
  "originalScore": "integer (0-100)",
  "barExamDate": "date",
  "isAnonymous": "boolean",
  "agreedToTerms": "boolean (required)",
  "publishingConsent": "boolean (required)",
  "featuredSubmission": "boolean (private)",
  "submissionDate": "datetime (auto-generated)",
  "ipAddress": "string (private)",
  "userAgent": "string (private)"
}
```

## API Endpoints

### Public Endpoints

#### 1. Submit New Essay
```http
POST /api/user-essay-submissions
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "data": {
    "title": "Constitutional Law Analysis",
    "content": "<p>Essay content here...</p>",
    "submissionType": "essay",
    "subject": 1,
    "submitterName": "John Doe",
    "submitterEmail": "john@example.com",
    "submitterYear": "3L",
    "lawSchool": "Harvard Law School",
    "graduationYear": 2024,
    "agreedToTerms": true,
    "publishingConsent": true,
    "isAnonymous": false
  },
  "files": {
    "attachments": [/* File objects */]
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "title": "Constitutional Law Analysis",
    "status": "pending",
    "submissionDate": "2025-06-29T18:00:00.000Z",
    // ... other fields
  }
}
```

#### 2. Get Approved Submissions (Public Display)
```http
GET /api/user-essay-submissions/approved?page=1&pageSize=10&subject=1
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Constitutional Law Analysis",
      "content": "<p>Essay content...</p>",
      "submitterName": "John Doe",
      "subject": {
        "id": 1,
        "title": "Constitutional Law"
      },
      "publishedAt": "2025-06-29T18:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

### Authenticated User Endpoints

#### 3. Get My Submissions
```http
GET /api/user-essay-submissions/my-submissions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "My Essay",
      "status": "pending",
      "submissionDate": "2025-06-29T18:00:00.000Z",
      "moderationNotes": null,
      "rejectionDetails": null
    }
  ]
}
```

### Admin Endpoints

#### 4. Update Submission Status
```http
PUT /api/user-essay-submissions/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "approved",
  "moderationNotes": "Great work! This meets our publication standards.",
  "rejectionReason": null,
  "rejectionDetails": null
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "status": "approved",
    "reviewedAt": "2025-06-29T18:00:00.000Z",
    "reviewedBy": {
      "id": 1,
      "firstname": "Admin",
      "lastname": "User"
    }
  }
}
```

#### 5. Get Submissions by Status
```http
GET /api/user-essay-submissions/by-status/pending?page=1&pageSize=25
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Essay Title",
      "submitterName": "John Doe",
      "submitterEmail": "john@example.com",
      "submissionDate": "2025-06-29T18:00:00.000Z",
      "status": "pending"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

#### 6. Get Statistics
```http
GET /api/user-essay-submissions/statistics
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "totalSubmissions": 150,
  "statusCounts": {
    "pending": 25,
    "underReview": 10,
    "approved": 100,
    "rejected": 15
  },
  "recentSubmissions": [
    {
      "id": 1,
      "title": "Recent Essay",
      "submitterName": "John Doe",
      "submissionDate": "2025-06-29T18:00:00.000Z"
    }
  ]
}
```

#### 7. Full CRUD Operations (Admin Only)
```http
GET /api/user-essay-submissions              # List all
GET /api/user-essay-submissions/:id          # Get one
PUT /api/user-essay-submissions/:id          # Update
DELETE /api/user-essay-submissions/:id       # Delete
```

## File Upload Specifications

### Allowed File Types
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, PNG, GIF

### File Constraints
- **Maximum file size**: 10MB per file
- **File name requirements**: Letters, numbers, dots, hyphens, underscores only
- **Multiple files**: Supported via `attachments` field

### File Upload Example
```javascript
const formData = new FormData();
formData.append('data', JSON.stringify({
  title: 'My Essay',
  content: '<p>Content here</p>',
  // ... other fields
}));
formData.append('files.attachments', file1);
formData.append('files.attachments', file2);

fetch('/api/user-essay-submissions', {
  method: 'POST',
  body: formData
});
```

## Authentication & Authorization

### Authentication Methods
1. **Public submissions**: No authentication required for submission
2. **User submissions**: JWT token for viewing own submissions
3. **Admin operations**: Admin JWT token required

### Permission Levels
- **Public**: Submit essays, view approved essays
- **Authenticated Users**: View own submissions
- **Admins**: Full CRUD, moderation, statistics

## Email Notifications

### Admin Notifications
Sent when new submissions are created:
- **Recipients**: All active admin users
- **Content**: Submission details and review link
- **Trigger**: New submission created

### Submitter Notifications
Sent when submission status changes:
- **Recipients**: Original submitter
- **Content**: Status update and any feedback
- **Triggers**: Status changes to approved, rejected, needs-revision

## Moderation Workflow

### Submission Statuses
1. **pending**: Initial status after submission
2. **under-review**: Admin has started reviewing
3. **approved**: Approved for publication (auto-publishes)
4. **rejected**: Not suitable for publication
5. **needs-revision**: Requires changes before approval

### Admin Actions
1. **Review submission**: Change status and add notes
2. **Approve**: Publishes submission automatically
3. **Reject**: With reason and detailed feedback
4. **Request revision**: With specific feedback
5. **Feature**: Mark as featured content (admin only)

## Error Handling

### Common Error Responses

#### Validation Error
```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Missing required fields",
    "details": {
      "errors": [
        {
          "path": ["title"],
          "message": "Title is required"
        }
      ]
    }
  }
}
```

#### Authentication Error
```json
{
  "error": {
    "status": 401,
    "name": "UnauthorizedError",
    "message": "Authentication required"
  }
}
```

#### File Upload Error
```json
{
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "File document.pdf exceeds maximum size of 10MB"
  }
}
```

## Integration Examples

### Frontend Form Integration
```javascript
// Submit essay with file upload
async function submitEssay(formData) {
  try {
    const response = await fetch('/api/user-essay-submissions', {
      method: 'POST',
      body: formData // FormData with files
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Submission successful:', result.data);
    } else {
      const error = await response.json();
      console.error('Submission failed:', error.error.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Check submission status
async function checkSubmissionStatus(userToken) {
  const response = await fetch('/api/user-essay-submissions/my-submissions', {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  const submissions = await response.json();
  return submissions.data;
}
```

### Admin Dashboard Integration
```javascript
// Get pending submissions for admin review
async function getPendingSubmissions(adminToken) {
  const response = await fetch('/api/user-essay-submissions/by-status/pending', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  return response.json();
}

// Update submission status
async function updateSubmissionStatus(id, status, notes, adminToken) {
  const response = await fetch(`/api/user-essay-submissions/${id}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status,
      moderationNotes: notes
    })
  });
  
  return response.json();
}
```

## Testing the API

### Test Submission
```bash
curl -X POST http://localhost:1337/api/user-essay-submissions \
  -F 'data={"title":"Test Essay","content":"<p>Test content</p>","submitterName":"Test User","submitterEmail":"test@example.com","submitterYear":"3L","agreedToTerms":true,"publishingConsent":true}' \
  -F 'files.attachments=@test-document.pdf'
```

### Test Admin Operations
```bash
# Update status (requires admin token)
curl -X PUT http://localhost:1337/api/user-essay-submissions/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","moderationNotes":"Excellent work!"}'
```

This comprehensive API supports the full essay submission workflow from initial submission through admin review to publication.