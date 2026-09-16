#!/usr/bin/env python3
"""
Test the new yield_grade functionality in the main prediction endpoint
"""

import requests
import json

def test_new_grading():
    """Test that the main predict endpoint now returns yield_grade"""
    
    url = "http://localhost:5000/api/predict"
    
    # Test both Maize and Rice
    test_cases = [
        {
            "name": "Maize - Good Conditions",
            "payload": {
                "farmer_id": "F001",
                "crop": "Maize",
                "sector": "Gashora", 
                "season": "Season A",
                "month": "October",
                "farm_size": 100,
                "area_planted": 90,
                "fertilizer_used": "Yes",
                "irrigation_used": "Yes",
                "seed_variety": "Hybrid",
                "soil_type": "Loam"
            },
            "expected_grade": ["Average", "Good", "Excellent"]
        },
        {
            "name": "Rice - Good Conditions", 
            "payload": {
                "farmer_id": "F002",
                "crop": "Rice",
                "sector": "Gashora",
                "season": "Season A", 
                "month": "October",
                "farm_size": 150,
                "area_planted": 120,
                "fertilizer_used": "Yes",
                "irrigation_used": "Yes",
                "seed_variety": "Hybrid",
                "soil_type": "Loam"
            },
            "expected_grade": ["Average", "Good", "Excellent"]
        }
    ]
    
    print("🧪 TESTING NEW YIELD_GRADE FUNCTIONALITY")
    print("=" * 60)
    
    for test in test_cases:
        print(f"\n📊 {test['name']}")
        print("-" * 40)
        
        try:
            response = requests.post(url, json=test['payload'], timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                yield_val = result.get('yield_per_are_kg', 0)
                yield_grade = result.get('yield_grade', 'NOT_FOUND')
                
                print(f"Yield: {yield_val:.2f} kg/are")
                print(f"Grade: {yield_grade}")
                
                if yield_grade == 'NOT_FOUND':
                    print("❌ ISSUE: yield_grade not returned by API")
                elif yield_grade in test['expected_grade']:
                    print(f"✅ SUCCESS: Grade '{yield_grade}' is in expected range")
                elif yield_grade == 'Below Average':
                    print(f"❌ STILL ISSUE: Grade is still 'Below Average'")
                else:
                    print(f"⚠️ UNEXPECTED: Grade '{yield_grade}' not in expected range")
                
                # Show realistic thresholds
                crop = test['payload']['crop']
                if crop == 'Maize':
                    thresholds = "Average≥17.0, Good≥24.0, Excellent≥30.0"
                elif crop == 'Rice':
                    thresholds = "Average≥25.6, Good≥32.0, Excellent≥40.0"
                else:
                    thresholds = "Unknown"
                    
                print(f"Thresholds ({crop}): {thresholds}")
                    
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n💡 NEXT STEPS:")
    print(f"1. If yield_grade is working, refresh your browser (Ctrl+F5)")
    print(f"2. Make a new prediction in the app")
    print(f"3. You should now see proper grades instead of 'Below Average'")

if __name__ == "__main__":
    test_new_grading()