
CREATE POLICY "public read documents bucket" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'documents');
CREATE POLICY "public write documents bucket" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "public update documents bucket" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
CREATE POLICY "public delete documents bucket" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'documents');
