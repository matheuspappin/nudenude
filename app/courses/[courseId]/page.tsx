'use client';

import React, { useState, useEffect } from 'react';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import Link from 'next/link';
import UpcomingEvents from '@/components/UpcomingEvents';
import { createClient } from '@/utils/supabase/client';

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Submit Review State
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewVideoUrl, setReviewVideoUrl] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setCurrentUser(user);

      // 1. Fetch Course details
      const { data: courseData, error: courseErr } = await supabase
        .from('courses')
        .select('*, profiles(username)')
        .eq('id', params.courseId)
        .single();
        
      if (courseErr || !courseData) {
         setError('Course not found.');
         setIsLoading(false);
         return;
      }
      setCourse(courseData);

      // 2. Fetch Events for this creator
      const { data: eventsData } = await supabase
        .from('creator_events')
        .select('*')
        .eq('creator_id', courseData.creator_id)
        .order('event_date', { ascending: true })
        .limit(3);
      setEvents(eventsData || []);

      // 3. Fetch Reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profiles(username, display_name)')
        .eq('course_id', params.courseId)
        .order('created_at', { ascending: false });
      setReviews(reviewsData || []);

      // 4. Check Purchase (or if is creator)
      if (user) {
        if (user.id === courseData.creator_id) {
          setHasPurchased(true); // Owner
        } else {
          const { data: purchase } = await supabase
            .from('purchases')
            .select('status')
            .eq('course_id', params.courseId)
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .maybeSingle();
            
          if (purchase) {
             setHasPurchased(true);
          }
        }
      }

      setIsLoading(false);
    }
    fetchData();
  }, [params.courseId, supabase]);

  const handleCheckout = async () => {
    if (!currentUser) {
      alert('Please log in to purchase this masterclass.');
      return;
    }
    setError('');
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: params.courseId, userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout error');
      }
    } catch (err: any) {
      alert(err.message);
    } 
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!currentUser) return;
     setIsSubmittingReview(true);
     
     const { error } = await supabase.from('reviews').insert({
       course_id: params.courseId,
       student_id: currentUser.id,
       rating: reviewRating,
       comment: reviewText,
       video_proof_url: reviewVideoUrl || null,
     });

     if (error) {
       alert("Error submitting review: " + error.message);
     } else {
       alert("Review submitted!");
       setShowReviewForm(false);
       // Optimistic UI update or trigger reload
       window.location.reload();
     }
     setIsSubmittingReview(false);
  }

  if (isLoading) {
    return <div className="w-full min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (error || !course) {
    return <div className="w-full py-20 text-center text-red-500 font-bold text-xl">{error}</div>;
  }

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      
      {!hasPurchased ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center text-4xl mb-6 shadow-glow">
            💃
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">{course.title}</h1>
          <p className="text-zinc-400 max-w-lg mb-10 text-lg">
            {course.description || "Unlock exclusive choreographies, step-by-step tutorials, and live sessions with top CreatorDance instructors."}
          </p>
          <button 
            onClick={handleCheckout} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm py-4 px-10 rounded-full transition-all shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95"
          >
            Enroll Now (${course.price})
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area (Video) */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 relative">
               <CustomVideoPlayer lessonId="dummy-lesson-id" userId={currentUser?.id} />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <h2 className="text-3xl font-bold text-white">{course.title}</h2>
              <p className="text-zinc-400">{course.description}</p>
            </div>
          </div>
          
          {/* Sidebar (Curriculum) */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className="bg-card border border-white/10 rounded-xl p-6">
              <h3 className="font-bold text-lg text-white mb-4">Course Curriculum</h3>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-white font-medium text-sm">Full Class</span>
                  <span className="ml-auto text-xs text-primary font-bold">Playing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Showcase / Reviews */}
      {hasPurchased && (
        <div className="mt-16 w-full max-w-4xl mx-auto border-t border-white/10 pt-16 mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-black text-white mb-2">Dance Student Showcase</h3>
              <p className="text-zinc-400 text-sm">See how other students are mastering this choreography and share your own progress video.</p>
            </div>
            <button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="shrink-0 px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-glow hover:scale-105 transition-transform"
            >
              Submit Your Video
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-card border border-white/10 p-6 rounded-2xl mb-8 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
               <h4 className="font-bold text-white">Leave a Review & Showcase</h4>
               <div className="flex flex-col gap-2">
                 <label className="text-sm text-zinc-400">Rating (1-5)</label>
                 <input type="number" min="1" max="5" value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} className="h-10 bg-background border border-white/10 rounded-lg px-3 text-white" required />
               </div>
               <div className="flex flex-col gap-2">
                 <label className="text-sm text-zinc-400">Comment</label>
                 <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} className="bg-background border border-white/10 rounded-lg p-3 text-white min-h-[100px]" required></textarea>
               </div>
               <div className="flex flex-col gap-2">
                 <label className="text-sm text-zinc-400">YouTube/TikTok Reel URL (Optional)</label>
                 <input type="url" value={reviewVideoUrl} onChange={e => setReviewVideoUrl(e.target.value)} placeholder="https://youtube.com/shorts/..." className="h-10 bg-background border border-white/10 rounded-lg px-3 text-white" />
               </div>
               <button type="submit" disabled={isSubmittingReview} className="mt-2 h-10 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors">
                 {isSubmittingReview ? 'Submitting...' : 'Post Review'}
               </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {reviews.length === 0 ? (
               <div className="col-span-full py-8 text-center text-zinc-500 text-sm">No reviews yet. Be the first to showcase your dance!</div>
             ) : (
               reviews.map(review => (
                 <div key={review.id} className="bg-card border border-white/10 p-5 rounded-2xl flex flex-col gap-4 group">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                       {review.profiles?.display_name?.charAt(0) || review.profiles?.username?.charAt(0) || 'U'}
                     </div>
                     <div>
                       <p className="text-white font-bold text-sm">{review.profiles?.display_name || review.profiles?.username || 'User'}</p>
                       <p className="text-amber-500 text-xs">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                     </div>
                     <span className="ml-auto bg-green-500/20 text-green-500 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20 uppercase tracking-widest">Verified</span>
                   </div>
                   <p className="text-sm text-zinc-300">{review.comment}</p>
                   {review.video_proof_url && (
                     <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-white/5 cursor-pointer flex items-center justify-center">
                        <span className="text-zinc-600 text-xs">External Video Attached</span>
                        {/* We could render an iframe if it's youtube, but for now a generic thumbnail */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                        </div>
                     </div>
                   )}
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {/* Tour Dates Shelf */}
      {events.length > 0 && (
         <UpcomingEvents events={events} creatorName={course?.profiles?.username || "Instructor"} />
      )}
    </div>
  );
}
