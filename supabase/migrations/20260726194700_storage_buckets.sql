-- Storage buckets for avatars and image uploads

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies on storage.objects

DROP POLICY IF EXISTS "Public Read Access for Avatars" ON storage.objects;
CREATE POLICY "Public Read Access for Avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Read Access for Uploads" ON storage.objects;
CREATE POLICY "Public Read Access for Uploads" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Public Read Access for Images" ON storage.objects;
CREATE POLICY "Public Read Access for Images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Authenticated Insert for Avatars" ON storage.objects;
CREATE POLICY "Authenticated Insert for Avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Insert for Uploads" ON storage.objects;
CREATE POLICY "Authenticated Insert for Uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Insert for Images" ON storage.objects;
CREATE POLICY "Authenticated Insert for Images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update for Avatars" ON storage.objects;
CREATE POLICY "Authenticated Update for Avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update for Uploads" ON storage.objects;
CREATE POLICY "Authenticated Update for Uploads" ON storage.objects
FOR UPDATE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update for Images" ON storage.objects;
CREATE POLICY "Authenticated Update for Images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
