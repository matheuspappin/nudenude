'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminContentModeration() {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    // Fetch courses with their creator details
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        profiles (
          display_name,
          username
        )
      `)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setCourses(data);
    }
    setIsLoading(false);
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('WARNING: Are you sure you want to completely DELETE this course? This action cannot be undone and will remove it from the platform.')) return;
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
      
    if (!error) {
      fetchContent();
    } else {
      alert('Failed to delete course: ' + error.message);
    }
  };

  if (isLoading) return <div className="text-zinc-400">Loading content...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-red-500/20 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Moderation</h1>
          <p className="text-red-400 text-sm mt-1">Total Courses: {courses.length}</p>
        </div>
        <button onClick={fetchContent} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded">
          Refresh Data
        </button>
      </div>

      <div className="bg-card border border-red-500/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-red-950/20 text-xs uppercase font-bold text-red-400 border-b border-red-500/20">
              <tr>
                <th className="px-6 py-4">Course Details</th>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} className="border-b border-red-500/10 hover:bg-red-500/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{course.title}</div>
                    <div className="text-zinc-500 text-xs max-w-xs truncate">{course.description}</div>
                    <div className="text-zinc-600 text-[10px] mt-1">{course.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-300">{course.profiles?.display_name}</div>
                    <div className="text-zinc-500 text-xs">@{course.profiles?.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-green-400">${course.price}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => deleteCourse(course.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                      Delete Course
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
