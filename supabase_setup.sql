-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    department TEXT,
    designation TEXT,
    role TEXT DEFAULT 'FACULTY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, department, designation, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'designation',
        COALESCE(NEW.raw_user_meta_data->>'role', 'FACULTY')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create activity tables
CREATE TABLE IF NOT EXISTS journal_publications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    journal_name TEXT,
    publication_date DATE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conference_publications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    conference_name TEXT,
    conference_date DATE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    book_title TEXT NOT NULL,
    publication_year INTEGER,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on activity tables
ALTER TABLE journal_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities" ON journal_publications
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own activities" ON journal_publications
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own activities" ON journal_publications
    FOR UPDATE USING (auth.uid() = profile_id);

-- Repeat for other tables
CREATE POLICY "Users can view their own activities" ON conference_publications
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own activities" ON conference_publications
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own activities" ON conference_publications
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can view their own activities" ON books
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own activities" ON books
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own activities" ON books
    FOR UPDATE USING (auth.uid() = profile_id);

-- Create analytics views
CREATE OR REPLACE VIEW faculty_annual_score AS
SELECT
    p.id as profile_id,
    EXTRACT(YEAR FROM COALESCE(jp.publication_date, cp.conference_date, b.created_at)) as year,
    COUNT(CASE WHEN jp.status = 'APPROVED' THEN 1 END) * 10 as journal_score,
    COUNT(CASE WHEN cp.status = 'APPROVED' THEN 1 END) * 8 as conference_score
FROM profiles p
LEFT JOIN journal_publications jp ON p.id = jp.profile_id
LEFT JOIN conference_publications cp ON p.id = cp.profile_id
LEFT JOIN books b ON p.id = b.profile_id
WHERE jp.status = 'APPROVED' OR cp.status = 'APPROVED' OR b.status = 'APPROVED'
GROUP BY p.id, EXTRACT(YEAR FROM COALESCE(jp.publication_date, cp.conference_date, b.created_at));

CREATE OR REPLACE VIEW faculty_career_score AS
SELECT
    p.id as profile_id,
    p.full_name,
    p.department,
    COALESCE(SUM(
        CASE
            WHEN jp.status = 'APPROVED' THEN 10
            WHEN cp.status = 'APPROVED' THEN 8
            WHEN b.status = 'APPROVED' THEN 5
            ELSE 0
        END
    ), 0) as career_score
FROM profiles p
LEFT JOIN journal_publications jp ON p.id = jp.profile_id
LEFT JOIN conference_publications cp ON p.id = cp.profile_id
LEFT JOIN books b ON p.id = b.profile_id
GROUP BY p.id, p.full_name, p.department;