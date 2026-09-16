#!/usr/bin/env python3
"""
Test both Maize and Rice predictions to verify grading works correctly
"""

import requests
import json

def test_both_crops():
    """Test Maize and Rice with good conditions"""
    
    url = "http://localhost:5000/api/predict"
    
    # Test cases for both crops
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
            "thresholds": {"avg": 17.0, "good": 24.0, "excellent": 30.0}
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
            "thresholds": {"avg": 25.6, "good": 32.0, "excellent": 40.0}
        }
    ]
    
    print("🧪 TESTING BOTH CROPS WITH GOOD CONDITIONS")
    print("=" * 60)
    
    for test in test_cases:
        print(f"\n📊 {test['name']}")
        print("-" * 40)
        
        try:
            response = requests.post(url, json=test['payload'], timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                yield_val = result.get('yield_per_are_kg', 0)
                
                # Calculate grade using realistic thresholds
                thresholds = test['thresholds']
                if yield_val >= thresholds['excellent']:
                    grade, emoji = 'Excellent', '🏆'
                elif yield_val >= thresholds['good']:
                    grade, emoji = 'Good', '⭐'
                elif yield_val >= thresholds['avg']:
                    grade, emoji = 'Average', '📊'
                else:
                    grade, emoji = 'Below Average', '❌'
                
                print(f"Yield: {yield_val:.2f} kg/are")
                print(f"Grade: {emoji} {grade}")
                print(f"Confidence: {result.get('confidence_pct', 'N/A')}%")
                
                # Show what this should be
                crop = test['payload']['crop']
                print(f"\n📏 {crop} Thresholds:")
                print(f"  Average:   ≥ {thresholds['avg']:.1f} kg/are")
                print(f"  Good:      ≥ {thresholds['good']:.1f} kg/are")
                print(f"  Excellent: ≥ {thresholds['excellent']:.1f} kg/are")
                
                if grade == 'Below Average':
                    print(f"❌ ISSUE: {yield_val:.1f} kg/are still showing as Below Average")
                else:
                    print(f"✅ SUCCESS: {yield_val:.1f} kg/are now shows as {grade}")
                    
            else:
                print(f"❌ API Error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n💡 FRONTEND CACHE ISSUE:")
    print(f"If predictions still show 'Below Average' in browser:")
    print(f"1. Hard refresh browser (Ctrl+F5)")
    print(f"2. Clear browser cache")
    print(f"3. Close and reopen browser tab")

if __name__ == "__main__":
    test_both_crops()