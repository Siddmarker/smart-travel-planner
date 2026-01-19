import React from 'react';

const REVIEWS = [
    {
        id: 1,
        name: "Arjun Mehta",
        role: "Solo Traveler",
        text: "Finally an app that understands 'Vibe' based travel! The discovery mode found a hidden cafe right next to my hotel in Bangalore that wasn't on any other map.",
        stars: 5
    },
    {
        id: 2,
        name: "Sarah Jenkins",
        role: "Backpacker",
        text: "The AI itinerary generator saved me hours of research. I just entered 'Relaxing' and 'Coorg', and it gave me a perfect 3-day plan instantly.",
        stars: 5
    },
    {
        id: 3,
        name: "Rahul & Team",
        role: "Group Trip",
        text: "Used the split cost feature for our Goa trip. Usually, money talks are awkward, but this made it seamless. No fighting over bills!",
        stars: 5
    },
    {
        id: 4,
        name: "Priya Sharma",
        role: "Weekend Explorer",
        text: "I love the 'Discovery Mode'. I found a beautiful trekking spot just 20km from my house that I never knew existed.",
        stars: 4
    },
    {
        id: 5,
        name: "David Chen",
        role: "Digital Nomad",
        text: "Perfect for solo travelers. I felt safe and guided. The local safety scores gave me peace of mind when exploring new areas at night.",
        stars: 5
    },
    {
        id: 6,
        name: "Ananya G.",
        role: "Family Vacation",
        text: "The multi-day planner is a game changer. It organized our entire Rajasthan tour including rest stops for my parents. Highly recommended.",
        stars: 5
    },
    {
        id: 7,
        name: "Karthik R.",
        role: "Foodie",
        text: "The recommendations were spot on, not just tourist traps. It took me to authentic messes instead of just fancy expensive restaurants.",
        stars: 5
    },
    {
        id: 8,
        name: "Sneha P.",
        role: "Planner",
        text: "Group planning was actually fun for once. We could all vote on the itinerary and see the changes in real-time.",
        stars: 5
    },
    {
        id: 9,
        name: "Mike Ross",
        role: "Adventure Seeker",
        text: "Instant itinerary changes when we were running late were a lifesaver. The dynamic routing is super smart.",
        stars: 4
    },
    {
        id: 10,
        name: "Tanvi D.",
        role: "Budget Traveler",
        text: "Budget tracking helped us stay on track without killing the vibe. The 'Budget' filter actually works!",
        stars: 5
    }
];

export default function UserReviews() {
    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Decorative Gradients */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-900/20 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-900/20 blur-[100px] rounded-full"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                        Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Travelers</span>
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        From solo backpackers to large family groups, see how 2wards is changing the way India travels.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {REVIEWS.map((review) => (
                        <div key={review.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors duration-300">
                            <div className="flex items-center gap-1 mb-4 text-yellow-500">
                                {[...Array(review.stars)].map((_, i) => (
                                    <span key={i}>★</span>
                                ))}
                            </div>
                            <p className="text-gray-300 mb-6 leading-relaxed italic">"{review.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                                    {review.name[0]}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">{review.name}</h4>
                                    <p className="text-gray-500 text-xs">{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}