/*
  # Add Skills Tables

  1. New Tables
    - `skills`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `developer_skills`
      - `developer_id` (uuid, references developer_profiles)
      - `skill_id` (uuid, references skills)
      - `years_of_experience` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing skills
*/

-- Create skills table
CREATE TABLE skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create developer_skills junction table
CREATE TABLE developer_skills (
    developer_id uuid REFERENCES developer_profiles(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
    years_of_experience integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (developer_id, skill_id)
);

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_skills ENABLE ROW LEVEL SECURITY;

-- Policies for skills table
CREATE POLICY "Skills are viewable by everyone"
    ON skills
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create skills"
    ON skills
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policies for developer_skills table
CREATE POLICY "Developer skills are viewable by everyone"
    ON developer_skills
    FOR SELECT
    USING (true);

CREATE POLICY "Developers can manage their own skills"
    ON developer_skills
    FOR ALL
    USING (auth.uid() = developer_id);

-- Insert some common programming skills
INSERT INTO skills (name) VALUES
    ('JavaScript'),
    ('TypeScript'),
    ('React'),
    ('Node.js'),
    ('Python'),
    ('Java'),
    ('C#'),
    ('Ruby'),
    ('PHP'),
    ('Go'),
    ('Rust'),
    ('SQL'),
    ('MongoDB'),
    ('AWS'),
    ('Docker'),
    ('Kubernetes'),
    ('GraphQL'),
    ('REST API'),
    ('Vue.js'),
    ('Angular')
ON CONFLICT (name) DO NOTHING;