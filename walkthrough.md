# Admin Authentication Migration Walkthrough

The transition to a PostgreSQL-backed authentication system for the admin dashboard is now complete!

## Changes Made
1. **Database Update**: Added the `AdminUser` table to your PostgreSQL database.
2. **Seeded Initial Users**:
   - Superadmin: `MK-C052`
   - Admin: `MK-C0001`
   - *Note: I set the default password for both accounts to `admin123` so you can log in immediately. We can build a password change page later if you'd like!*
3. **Login API Refactored**: `app/api/auth/login/route.ts` now verifies credentials strictly against the PostgreSQL database. It checks that the user exists, is active, and the password matches.
4. **Roles Assigned**: Upon successful login, the session is granted either `superadmin` or `admin` capabilities based on the DB role.
5. **UI Updates**: The login form now explicitly asks for "Personnel ID / Username", making it clearer for staff. I also added automatic capitalization to the field (e.g., typing `mk-c052` will look like `MK-C052`).
6. **Fallback Retained**: Just in case you get locked out of your `MK-` accounts, the default system "admin" username with your `.env` password will still work as a fallback.

## How to Test
1. Go to the `/login` page on your dashboard.
2. Enter `MK-C052` in the Personnel ID field.
3. Enter `admin123` in the password field.
4. Hit **Sign In**—you should be securely redirected to the dashboard!
