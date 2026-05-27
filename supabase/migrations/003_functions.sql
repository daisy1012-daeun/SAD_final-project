-- ============================================================
-- 003_functions.sql  –  RPC 함수
-- ============================================================

-- total_points 증가 (atomic)
CREATE OR REPLACE FUNCTION increment_total_points(uid uuid, delta int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET total_points = total_points + delta WHERE id = uid;
END;
$$;

-- 단과대별 월간 포인트 집계 리더보드
CREATE OR REPLACE FUNCTION leaderboard_by_college(month_start date)
RETURNS TABLE(college_id uuid, college_name text, total_points bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    col.id                   AS college_id,
    col.name                 AS college_name,
    COALESCE(SUM(pe.points), 0)::bigint AS total_points
  FROM colleges col
  LEFT JOIN departments dep ON dep.college_id = col.id
  LEFT JOIN users u         ON u.department_id = dep.id
  LEFT JOIN point_events pe ON pe.user_id = u.id
    AND pe.created_at >= month_start
  GROUP BY col.id, col.name
  ORDER BY total_points DESC;
END;
$$;
