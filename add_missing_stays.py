import json
import requests
import random

# --- 1. CONFIGURATION ---
# Replace with your actual Supabase credentials
SUPABASE_URL = "YOUR_PROJECT_URL" 
SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY" # Must be service_role to write data

# --- 2. CUSTOMISE YOUR CITIES HERE ---
# Add any city you want to "fix" by adding hotels to it.
TARGET_CITIES = [
    {"name": "Goa", "country": "India", "lat": 15.2993, "lng": 74.1240, "zones": ["North Goa", "South Goa", "Panjim", "Calangute"]},
    {"name": "Bangalore", "country": "India", "lat": 12.9716, "lng": 77.5946, "zones": ["Indiranagar", "Koramangala", "Whitefield", "MG Road"]},
    {"name": "Mumbai", "country": "India", "lat": 19.0760, "lng": 72.8777, "zones": ["Bandra", "Colaba", "Juhu", "Andheri"]},
    {"name": "Jaipur", "country": "India", "lat": 26.9124, "lng": 75.7873, "zones": ["Pink City", "Amer", "Vaishali Nagar"]},
    {"name": "Manali", "country": "India", "lat": 32.2432, "lng": 77.1892, "zones": ["Old Manali", "Mall Road"]},
    {"name": "Coorg", "country": "India", "lat": 12.3375, "lng": 75.8069, "zones": ["Madikeri", "Virajpet"]},
    {"name": "Kerala", "country": "India", "lat": 10.8505, "lng": 76.2711, "zones": ["Munnar", "Alleppey", "Kochi"]},
    # Add more cities here as needed...
]

# --- 3. ACCOMMODATION TEMPLATES ---
# We use these to generate realistic-looking data
HOTEL_PREFIXES = ["Grand", "Royal", "The", "Elite", "Luxury", "Cozy"]
HOTEL_SUFFIXES = ["Resort", "Hotel", "Suites", "Stay", "Villa", "Palace", "Residency"]

def generate_stays_for_city(city):
    places = []
    
    # 1. Generate Luxury Resorts (Price Tier 4)
    for i in range(3):
        zone = random.choice(city["zones"])
        name = f"{random.choice(HOTEL_PREFIXES)} {city['name']} {random.choice(HOTEL_SUFFIXES)}"
        places.append({
            "name": name,
            "city": city["name"],
            "country": city["country"],
            "description": f"Experience world-class luxury at {name}, located in the beautiful {zone} area. Features sea views and spa.",
            "type": "resort", # Matches your new frontend logic
            "price_level": 4,
            "lat": city["lat"] + (random.uniform(-0.05, 0.05)),
            "lng": city["lng"] + (random.uniform(-0.05, 0.05)),
            "rating": round(random.uniform(4.5, 5.0), 1),
            "amenities": ["pool", "spa", "wifi", "bar", "beach_access", "breakfast"],
            "vibes": ["luxury", "relaxing", "romantic"],
            "image": "https://images.unsplash.com/photo-1571896349842-6e53ce41be63?auto=format&fit=crop&w=800",
            "zone_id": zone
        })

    # 2. Generate Mid-Range Hotels (Price Tier 3)
    for i in range(4):
        zone = random.choice(city["zones"])
        name = f"{city['name']} {random.choice(['City', 'Central', 'View', 'Plaza'])} Hotel"
        places.append({
            "name": name,
            "city": city["name"],
            "country": city["country"],
            "description": f"A comfortable and modern stay in {zone}, perfect for travelers and families.",
            "type": "hotel",
            "price_level": 3,
            "lat": city["lat"] + (random.uniform(-0.03, 0.03)),
            "lng": city["lng"] + (random.uniform(-0.03, 0.03)),
            "rating": round(random.uniform(4.0, 4.6), 1),
            "amenities": ["wifi", "parking", "restaurant", "gym"],
            "vibes": ["city", "convenient"],
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
            "zone_id": zone
        })

    # 3. Generate Budget Homestays/Hostels (Price Tier 1-2)
    for i in range(3):
        zone = random.choice(city["zones"])
        stay_type = random.choice(["hostel", "homestay"])
        name = f"{city['name']} {random.choice(['Backpackers', 'Heritage', 'Nest', 'Hideaway'])} {stay_type.capitalize()}"
        places.append({
            "name": name,
            "city": city["name"],
            "country": city["country"],
            "description": f"A cozy and affordable {stay_type} in {zone}. Great for meeting fellow travelers.",
            "type": stay_type,
            "price_level": random.choice([1, 2]),
            "lat": city["lat"] + (random.uniform(-0.02, 0.02)),
            "lng": city["lng"] + (random.uniform(-0.02, 0.02)),
            "rating": round(random.uniform(3.8, 4.5), 1),
            "amenities": ["wifi", "kitchen", "laundry"],
            "vibes": ["social", "budget", "rustic"],
            "image": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800",
            "zone_id": zone
        })

    return places

# --- 4. UPLOAD FUNCTION ---
def upload_data():
    all_new_places = []
    
    print("Generatng accommodation data...")
    for city in TARGET_CITIES:
        city_places = generate_stays_for_city(city)
        all_new_places.extend(city_places)
        print(f" -> Prepared {len(city_places)} stays for {city['name']}")

    # API Endpoint
    url = f"{SUPABASE_URL}/rest/v1/places"
    
    # Headers
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal" 
    }
    
    print(f"\nUploading {len(all_new_places)} new places to Supabase...")
    
    # Upload in chunks of 50 to avoid timeouts
    chunk_size = 50
    for i in range(0, len(all_new_places), chunk_size):
        chunk = all_new_places[i:i + chunk_size]
        response = requests.post(url, headers=headers, json=chunk)
        
        if response.status_code == 201:
            print(f"✅ Chunk {i//chunk_size + 1} uploaded successfully.")
        else:
            print(f"❌ Error uploading chunk {i//chunk_size + 1}: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    upload_data()