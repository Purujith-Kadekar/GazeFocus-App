-- Function to atomically fetch and update user activity and streak data
CREATE OR REPLACE FUNCTION update_user_activity_and_streak(
    p_user_id uuid,
    p_current_timestamp timestamptz -- Use server timestamp for consistency
) RETURNS json AS $$
DECLARE
    currentUser RECORD;
    today_utc date;
    last_active_utc date;
    days_since_last_active integer;
    new_streak integer;
    longest_streak_val integer;
    streak_updated boolean := false;
    result json;
BEGIN
    -- Ensure we are using UTC for date comparisons
    today_utc := date_trunc('day', p_current_timestamp AT TIME ZONE 'UTC');

    -- Fetch current user data atomically
    SELECT currentStreak, longestStreak, lastActiveDate INTO currentUser
    FROM "User"
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with id % not found', p_user_id;
    END IF;

    -- Calculate days since last active
    last_active_utc := CASE WHEN currentUser.lastActiveDate IS NOT NULL THEN date_trunc('day', currentUser.lastActiveDate::timestamptz AT TIME ZONE 'UTC') ELSE NULL END;
    days_since_last_active := CASE WHEN last_active_utc IS NOT NULL THEN date_part('day', today_utc - last_active_utc)::integer ELSE -1 END;

    -- Determine new streak value
    new_streak := currentUser.currentStreak;
    longest_streak_val := currentUser.longestStreak;

    IF days_since_last_active = -1 THEN -- First activity ever
        new_streak := 1;
        streak_updated := true;
    ELSIF days_since_last_active = 0 THEN -- Active today, streak continues
        new_streak := currentUser.currentStreak; -- No change needed unless we add more complex logic
    ELSIF days_since_last_active = 1 THEN -- Active yesterday, streak continues
        new_streak := (currentUser.currentStreak + 1);
        streak_updated := true;
    ELSIF days_since_last_active > 1 THEN -- Gap in activity, reset streak
        new_streak := 1;
        streak_updated := true;
    END IF;

    -- Update longest streak if current streak is greater
    IF new_streak > longest_streak_val THEN
        longest_streak_val := new_streak;
    END IF;

    -- Prepare update data
    UPDATE "User"
    SET
        lastActiveDate = p_current_timestamp, -- Always update lastActiveDate on activity
        currentStreak = CASE WHEN streak_updated THEN new_streak ELSE currentStreak END,
        longestStreak = longest_streak_val
    WHERE id = p_user_id;

    -- Return updated values
    SELECT currentStreak, longestStreak, lastActiveDate, lastLoginDate
    INTO result
    FROM "User"
    WHERE id = p_user_id;

    RETURN result;

END;
$$ LANGUAGE plpgsql;

-- NOTE: The original GET handler in activity/route.ts might need adjustment
-- to call this procedure if it only fetches data, or rely on the POST call for updates.
-- The GET handler should NOT reset the streak; it should only read.
