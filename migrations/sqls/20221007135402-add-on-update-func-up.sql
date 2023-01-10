CREATE FUNCTION on_update()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS $$
BEGIN
  IF NEW.deleted THEN
    NEW."deletedAt" = NOW();
  ELSE
    NEW."updatedAt" = NOW();
  END IF;

  RETURN NEW;
END;
$$
