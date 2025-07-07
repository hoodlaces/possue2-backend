# Urgent: Manual DATABASE_URL Update Required on Render

Since the Render CLI cannot update environment variables programmatically, you need to update it manually in the Render dashboard.

## Steps to Update DATABASE_URL:

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com/web/srv-cbng55ha6gds3kmf2890
   - Or go to https://dashboard.render.com and select "possue2-backend" service

2. **Navigate to Environment**
   - Click on the "Environment" tab in the service dashboard

3. **Add/Update DATABASE_URL**
   - Find DATABASE_URL in the environment variables list
   - If it exists, click "Edit"
   - If it doesn't exist, click "Add Environment Variable"
   - Key: `DATABASE_URL`
   - Value: 
   ```
   postgresql://possue2_db_v5_user:Xe%2FawaXl5gvTXKqKdZi5oGzkLisexhJdAHHGSh4bsQQ%3D@dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com:5432/possue2_db_v5?sslmode=require
   ```

4. **Save Changes**
   - Click "Save Changes"
   - The service will automatically redeploy with the new DATABASE_URL

## Important Notes:
- Copy the DATABASE_URL value EXACTLY as shown above
- The password is already URL-encoded (contains %2F and %3D)
- Do NOT decode or modify the password
- The `?sslmode=require` at the end is required

## Service Details:
- Service ID: srv-cbng55ha6gds3kmf2890
- Service Name: possue2-backend
- Database: possue2_db_v5
- User: possue2_db_v5_user

## Alternative: Use Individual Environment Variables
If DATABASE_URL doesn't work, you can set these individual variables instead:
- DATABASE_HOST: `dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com`
- DATABASE_PORT: `5432`
- DATABASE_NAME: `possue2_db_v5`
- DATABASE_USERNAME: `possue2_db_v5_user`
- DATABASE_PASSWORD: `Xe/awaXl5gvTXKqKdZi5oGzkLisexhJdAHHGSh4bsQQ=`
- DATABASE_SSL: `true`