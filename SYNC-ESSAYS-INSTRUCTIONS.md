# Instructions to Sync Your 2 New Essays

## Current Status
- ✅ Remote database backed up
- ✅ Local database backed up  
- 📝 2 new essays ready to sync (July 2023 questions)

## Step-by-Step Instructions

### 1. Access Local Strapi Admin
```bash
# If not already running:
npm run develop
```
Then go to: `http://localhost:1337/dashboard`

### 2. Export Essays from Local

1. In the admin sidebar, find **"Import Export"** plugin
2. Click on **"Export"**
3. Select content types:
   - ✅ **Essays** (api::essay.essay)
   - ❌ Uncheck everything else
4. Click **"Export"** button
5. Download the file (it will be a `.json` file)

### 3. Access Remote Strapi Admin

Go to: `https://possue2-backend.onrender.com/dashboard`

### 4. Import Essays to Remote

1. In the admin sidebar, find **"Import Export"** plugin
2. Click on **"Import"**
3. Upload the `.json` file you exported
4. **IMPORTANT**: Select import mode:
   - Choose **"Add only"** or **"Non-destructive"** mode
   - This ensures existing data isn't deleted
5. Click **"Import"** button

### 5. Verify the Import

After import completes:
- Check that you now have 244 published essays (up from 242)
- Verify the 2 new July 2023 essays appear
- Confirm users and subjects are unchanged

## Alternative: Direct Database Sync

If the Import/Export plugin doesn't work as expected, here's a direct SQL approach:

```bash
# 1. Export just the new essays from local
PGPASSWORD=1212 pg_dump -h 127.0.0.1 -p 5432 -U postgres \
  -d strapi-marketplace-v5 --data-only \
  -t essays -t essays_subjects_lnk \
  | grep -E "(1943|1944|1945)" > new-essays.sql

# 2. Import to remote
PGPASSWORD=$DATABASE_PASSWORD psql \
  -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com \
  -p 5432 -U possue2_db_v5_user -d possue2_db_v5 < new-essays.sql
```

## Your New Essays

1. **Question 1 - July, 2023** (ID: 1943)
   - About ABC law firm partnership liability
   - Status: Published

2. **Question 2 - July, 2023** (ID: 1945)  
   - About DishWay UltraKlean product
   - Status: Published

## Backup Locations

If anything goes wrong:
- Remote backup: `backups/remote-safety-backup.tar.gz`
- Local backup: `backups/selective/content-essays-answers-20250624-201126.sql`

## Need Help?

The Import/Export plugin should handle this smoothly. The key is using **non-destructive import mode** to preserve existing data while adding the new essays.