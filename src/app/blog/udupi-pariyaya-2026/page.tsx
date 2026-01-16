import React from 'react';
import Link from 'next/link';

// --- SEO METADATA ---
export const metadata = {
    title: 'Udupi Pariyaya 2026 Schedule & Guide: Shiroor Mutt | 2wards',
    description: 'Official schedule for Udupi Pariyaya 2026 (Shiroor Mutt). View the Jan 18th procession timeline, Darbar details, and explore nearby places with 2wards.',
    keywords: ['Udupi Pariyaya 2026 schedule', 'Shiroor Mutt Pariyaya', 'Pariyaya Darbar time', 'Udupi Pariyaya Procession', '2wards travel planner'],
    openGraph: {
        title: 'Udupi Pariyaya 2026: The Complete Guide',
        description: 'Everything you need to know about the Jan 18th Shiroor Mutt Pariyaya, from procession timings to hidden gems nearby.',
        images: ['/images/udupi-pariyaya.jpg'],
    },
};

export default function UdupiPariyayaBlog() {
    return (
        <div className="blog-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>

            {/* --- BLOG HEADER --- */}
            <article>
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ backgroundColor: '#eef2ff', display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', color: '#4f46e5', fontWeight: 'bold', marginBottom: '10px' }}>
                        Event Date: Jan 18, 2026
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a', lineHeight: '1.2' }}>Beyond the Temple: The Ultimate Guide to Udupi Pariyaya 2026</h1>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>January 16, 2026 • Travel & Culture Guide</p>
                </header>

                {/* HERO IMAGE */}
                <div style={{ width: '100%', height: '400px', backgroundColor: '#eee', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                        src="/images/udupi-pariyaya.jpg"
                        alt="Udupi Pariyaya Festival 2026 Procession"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <section>
                    <p style={{ fontSize: '1.1rem' }}>
                        If you are planning a visit to the coastal town of Udupi this January, you are witnessing history. The grand <strong>Udupi Sri Krishna Matha Pariyaya</strong> is set to take place on <strong>January 18, 2026</strong>.
                    </p>
                    <p>
                        This biennial festival is the soul of Udupi. It marks the ceremonial transfer of worship rights from one Swamiji to another among the eight <em>Ashta Mathas</em>. This year, the <strong>Shiroor Mutt</strong>, led by <strong>Sri Vedavardhana Tirtha Swamiji</strong>, ascends the <em>Sarvajna Peetha</em>.
                    </p>
                </section>

                {/* --- NEW SECTION: DETAILED SCHEDULE --- */}
                <section style={{ marginTop: '40px', backgroundColor: '#fff8e1', padding: '25px', borderRadius: '12px', border: '1px solid #ffe0b2' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d35400', marginBottom: '20px' }}>📅 Jan 18th: Pariyaya Day Schedule</h2>
                    <p style={{ marginBottom: '20px' }}>For devotees and travelers, here is the expected timeline of events for the big day:</p>

                    <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                        <li style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ffcc80' }}>
                            <strong>⏰ 2:15 AM:</strong> The incoming Swamiji takes a holy dip at <em>Dandathirtha</em> (near Kaup).
                        </li>
                        <li style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ffcc80' }}>
                            <strong>⏰ 3:00 AM:</strong> The <strong>Grand Procession</strong> begins at Jodukatte. The Swamiji is carried in a palanquin, accompanied by cultural tableaus and Chande (drums).
                        </li>
                        <li style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ffcc80' }}>
                            <strong>⏰ 5:00 AM - 6:00 AM:</strong> The Swamiji enters Car Street and takes Darshan of Lord Krishna through the <em>Kanakana Kindi</em>.
                        </li>
                        <li style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ffcc80' }}>
                            <strong>⏰ 6:30 AM:</strong> <strong>Akshaya Patra</strong> handover. The outgoing Swamiji hands over the vessel and the keys to the shrine to the incoming Shiroor Swamiji at the Sarvajna Peetha.
                        </li>
                        <li style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ffcc80' }}>
                            <strong>⏰ 7:00 AM:</strong> The <strong>Pariyaya Darbar</strong> begins at Rajangana. This is the grand public assembly where honors are exchanged.
                        </li>
                        <li style={{ marginBottom: '0' }}>
                            <strong>⏰ Noon:</strong> <strong>Maha Annadana</strong> (Mass Feeding). Thousands of devotees are served a traditional Udupi meal.
                        </li>
                    </ul>
                </section>

                <section style={{ marginTop: '40px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Don't Just Visit—Explore!</h2>
                    <p>
                        While the Pariyaya rituals are divine, the crowds can be overwhelming. Many devotees find peace by visiting the pristine beaches and heritage spots just minutes away after the Darbar.
                    </p>
                    <p>
                        <strong>This is where <a href="https://www.2wards.in" style={{ color: '#0070f3', fontWeight: 'bold', textDecoration: 'underline' }}>2wards.in</a> helps you.</strong> Our AI-powered travel planner lets you discover these "hidden gems" and build a seamless itinerary around your temple visit.
                    </p>
                </section>

                <section style={{ marginTop: '30px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px' }}>3 Must-Visit Places (Escape the Crowd)</h2>

                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50' }}>1. Kapu (Kaup) Beach & Lighthouse</h3>
                        <p style={{ fontStyle: 'italic', color: '#555' }}>Distance: 13 km from Krishna Matha</p>
                        <p>Famous for its 100-year-old lighthouse, this beach offers one of the best sunsets in India. It's the perfect place to relax after a busy morning at the temple.</p>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50' }}>2. St. Mary’s Island</h3>
                        <p style={{ fontStyle: 'italic', color: '#555' }}>Distance: 7 km to Malpe Harbor + Boat Ride</p>
                        <p>Known for unique hexagonal basalt rock formations, this geological monument is a perfect day trip. <em>Tip: Ferries usually run from 9 AM to 5 PM.</em></p>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50' }}>3. Mattu Beach</h3>
                        <p style={{ fontStyle: 'italic', color: '#555' }}>Distance: 10 km from Krishna Matha</p>
                        <p>A secluded paradise famous for the "Mattu Gulla" eggplant (used in the Pariyaya feast!). On lucky nights, you might even witness bioluminescent waters.</p>
                    </div>
                </section>

                {/* --- CALL TO ACTION --- */}
                <section style={{ marginTop: '50px', backgroundColor: '#f0f9ff', padding: '30px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center' }}>Plan Your Pariyaya Journey</h2>
                    <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 20px auto' }}>
                        Attending the Pariyaya requires smart planning. Use <strong>2wards</strong> to find hotels, manage your route, and collaborate with your family in real-time.
                    </p>

                    <div style={{ textAlign: 'center' }}>
                        <Link href="/">
                            <button style={{
                                backgroundColor: '#0070f3',
                                color: 'white',
                                padding: '15px 30px',
                                borderRadius: '50px',
                                border: 'none',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
                            }}>
                                Start Planning Free on 2wards.in
                            </button>
                        </Link>
                    </div>
                </section>

            </article>
        </div>
    );
}