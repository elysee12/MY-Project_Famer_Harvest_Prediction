#!/usr/bin/env python3
"""
Test Rice prediction with optimal conditions to verify grading works for all crops.
"""

import requests
import json

def test_rice_prediction():
    """Test Rice prediction with optimal conditions"""
    
    url = "http://localhost:5000/api/predict"
    
    # Optimal conditions for Rice
    rice_payload = {
        "farmer_id": "F002",
        "crop": "Rice",
        "sector": "Gashora", 
        "season": "Season A",  # Better season
        "month": "October",    # Good planting month
        "farm_size": 150,      # 1.5 hectares
        "area_planted": 120,   # 80% planted
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "fertilizer_amount_kg_are": 1.8,  # Optimal for Rice
        "irrigation_used": "Yes",  # Very important for Rice
        "seed_variety": "Hybrid",  # Best variety
        "soil_type": "Loam",      # Good soil
        "terrain": "Hillside",    # Best terrain
        "pest_pressure": "Low",   
        "previous_crop": "Beans", # Good rotation
        "extension_access": "Yes",
        "planting_date": "2024-10-15"
    }
    
    print("🌾 Testing Rice Prediction with Optimal Conditions")
    print("=" * 55)
    
    try:
        response = requests.post(url, json=rice_payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            yield_per_are = result.get('yield_per_are_kg', 0)
            
            # Rice thresholds
            if yield_per_are >= 40.0:
                grade = 'Excellent'
                emoji = '🏆'
            elif yield_per_are >= 30.0:
                grade = 'Good'
                emoji = '⭐'
            elif yield_per_are >= 20.0:
                grade = 'Average'
                emoji = '📊'
            else:
                grade = 'Below Average'
                emoji = '❌'
            
            print(f"Rice Yield: {yield_per_are:.2f} kg/are")
            print(f"Grade: {emoji} {grade}")
            print(f"Confidence: {result.get('confidence_pct', 'N/A')}%")
            
            if grade in ['Good', 'Excellent']:
                print("✅ Rice grading works correctly!")
                return True
            else:
                print(f"⚠️ Rice still shows {grade}")
                return False
                
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_rice_prediction()