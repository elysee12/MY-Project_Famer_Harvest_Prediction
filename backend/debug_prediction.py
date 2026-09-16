#!/usr/bin/env python3
"""
Debug script to trace through the exact prediction that the user made
to understand why optimal conditions are producing low yields.
"""

import requests
import json

def debug_user_prediction():
    """Debug the exact prediction the user made based on their screenshots"""
    
    url = "http://localhost:5000/api/predict"
    
    # Exact conditions from user's screenshots
    user_payload = {
        "farmer_id": "F001",
        "crop": "Maize",
        "sector": "Gashora", 
        "season": "Season A",
        "month": "November",  # From screenshot, planting date 2024-09-01
        "farm_size": 500,     # 5 ha = 500 are
        "area_planted": 450,  # Assuming 90% planted
        "fertilizer_used": "Yes",
        "fertilizer_type": "Inorganic (NPK)",  # Default when not specified
        "irrigation_used": "Yes", 
        "seed_variety": "Improved",  # From screenshot
        "soil_type": "Loam",         # From screenshot
        "terrain": "Flat",           # Default
        "pest_pressure": "Medium",   # Default for November
        "previous_crop": "Beans",    # Default
        "extension_access": "Yes",
        "planting_date": "2024-09-01"
    }
    
    print("🔍 DEBUGGING USER'S EXACT PREDICTION")
    print("=" * 60)
    print("INPUT CONDITIONS:")
    for key, value in user_payload.items():
        if key != "farmer_id":
            print(f"  {key}: {value}")
    print("=" * 60)
    
    try:
        response = requests.post(url, json=user_payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            yield_per_are = result.get('yield_per_are_kg', 0)
            
            print(f"\n📊 PREDICTION RESULT:")
            print(f"Raw Yield: {yield_per_are:.2f} kg/are")
            print(f"Expected from screenshots: 15.8-18.5 kg/are")
            
            # Calculate what grade this SHOULD get with REALISTIC thresholds
            # Based on actual model training data: Maize benchmark = 17.01 kg/are
            if yield_per_are >= 30.0:    # Excellent: 30+ kg/are
                expected_grade = 'Excellent'
            elif yield_per_are >= 24.0:  # Good: 24+ kg/are  
                expected_grade = 'Good'
            elif yield_per_are >= 17.0:  # Average: 17+ kg/are (model benchmark)
                expected_grade = 'Average'
            else:
                expected_grade = 'Below Average'
                
            print(f"Actual Grade: {expected_grade}")
            print(f"Problem: {yield_per_are:.1f} kg/are is too low for optimal conditions!")
            
            # Analyze why yield is low
            print(f"\n🔍 PROBLEM ANALYSIS:")
            print(f"1. Base Maize yield should be ~23.22 kg/are")
            print(f"2. With optimal conditions, should be 30-40+ kg/are")
            print(f"3. Getting {yield_per_are:.1f} kg/are suggests:")
            
            # Check multipliers that might be wrong
            if "Improved" in str(user_payload.get("seed_variety", "")):
                print(f"   - Improved seed: Should have 1.0x multiplier (baseline)")
            
            if "Loam" in str(user_payload.get("soil_type", "")):
                print(f"   - Loam soil: Should have 1.05x boost")
                
            if user_payload.get("fertilizer_used") == "Yes":
                print(f"   - Fertilizer: Should have significant boost")
                
            if user_payload.get("irrigation_used") == "Yes": 
                print(f"   - Irrigation: Should have 1.04x boost")
                
            print(f"\n🔧 LIKELY ISSUES:")
            print(f"1. Model may be undertrained or using wrong base values")
            print(f"2. Feature engineering may have bugs")
            print(f"3. Multiplier system may not be working properly")
            print(f"4. Climate data for November may be suboptimal")
            
            # Test with October (optimal month)
            print(f"\n🧪 TESTING WITH OCTOBER (OPTIMAL MONTH):")
            october_payload = user_payload.copy()
            october_payload["month"] = "October"
            october_payload["planting_date"] = "2024-10-15"
            
            oct_response = requests.post(url, json=october_payload, timeout=10)
            if oct_response.status_code == 200:
                oct_result = oct_response.json()
                oct_yield = oct_result.get('yield_per_are_kg', 0)
                print(f"October yield: {oct_yield:.2f} kg/are")
                
                if oct_yield > yield_per_are:
                    print(f"✅ October is better (+{oct_yield - yield_per_are:.1f} kg/are)")
                else:
                    print(f"❌ Still low even in October - deeper model issue")
            
            return yield_per_are
            
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    debug_user_prediction()