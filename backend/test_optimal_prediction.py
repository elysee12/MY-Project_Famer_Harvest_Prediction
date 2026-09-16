#!/usr/bin/env python3
"""
Test script to verify that optimal prediction conditions now produce Good/Excellent grades.
This addresses the original issue where all predictions were showing "Below Average".
"""

import requests
import json

def test_optimal_prediction():
    """Test a prediction with optimal conditions to verify it gets Good/Excellent grade"""
    
    # API endpoint
    url = "http://localhost:5000/api/predict"
    
    # Optimal conditions that should produce Good/Excellent grade
    optimal_payload = {
        "farmer_id": "F001",
        "crop": "Maize",
        "sector": "Gashora", 
        "season": "Season A",  # Better season for Maize
        "month": "October",    # Optimal planting month
        "farm_size": 100,      # 1 hectare = 100 are
        "area_planted": 90,    # 90% of farm planted
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",  # Best type
        "fertilizer_amount_kg_are": 1.5,  # Optimal amount
        "irrigation_used": "Yes",
        "seed_variety": "Hybrid",  # Best variety
        "soil_type": "Loam",      # Best soil
        "terrain": "Hillside",    # Best terrain for Maize
        "pest_pressure": "Low",   # Best pest conditions
        "previous_crop": "Beans", # Good rotation
        "extension_access": "Yes",
        "planting_date": "2024-10-15"
    }
    
    print("🧪 Testing Optimal Prediction Conditions")
    print("=" * 60)
    print(f"Crop: {optimal_payload['crop']}")
    print(f"Season: {optimal_payload['season']}")
    print(f"Fertilizer: {optimal_payload['fertilizer_used']} ({optimal_payload['fertilizer_type']})")
    print(f"Irrigation: {optimal_payload['irrigation_used']}")
    print(f"Seed Variety: {optimal_payload['seed_variety']}")
    print(f"Soil Type: {optimal_payload['soil_type']}")
    print(f"Terrain: {optimal_payload['terrain']}")
    print("=" * 60)
    
    try:
        response = requests.post(url, json=optimal_payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            yield_per_are = result.get('yield_per_are_kg', 0)
            crop = result.get('crop', 'Unknown')
            
            # Calculate grade using same logic as backend
            YIELD_THRESHOLDS = {
                'Maize': {'poor': 15.0, 'avg': 20.0, 'good': 28.0, 'excellent': 35.0},
                'Beans': {'poor': 8.0, 'avg': 12.0, 'good': 16.0, 'excellent': 20.0},
                'Rice':  {'poor': 12.0, 'avg': 20.0, 'good': 30.0, 'excellent': 40.0},
            }
            
            thresholds = YIELD_THRESHOLDS.get(crop, YIELD_THRESHOLDS['Maize'])
            
            if yield_per_are >= thresholds['excellent']:
                grade = 'Excellent'
                emoji = '🏆'
                status = '✅ FIXED'
            elif yield_per_are >= thresholds['good']:
                grade = 'Good'
                emoji = '⭐'
                status = '✅ FIXED'
            elif yield_per_are >= thresholds['avg']:
                grade = 'Average'
                emoji = '📊'
                status = '⚠️ MARGINAL'
            else:
                grade = 'Below Average'
                emoji = '❌'
                status = '❌ STILL BROKEN'
            
            print(f"\n📊 PREDICTION RESULT:")
            print(f"Yield: {yield_per_are:.2f} kg/are")
            print(f"Grade: {emoji} {grade}")
            print(f"Status: {status}")
            print(f"Confidence: {result.get('confidence_pct', 'N/A')}%")
            print(f"Model: {result.get('model_used', 'N/A')}")
            
            # Check thresholds
            print(f"\n📏 GRADE THRESHOLDS FOR {crop.upper()}:")
            print(f"Excellent: ≥ {thresholds['excellent']:.1f} kg/are")
            print(f"Good:      ≥ {thresholds['good']:.1f} kg/are")
            print(f"Average:   ≥ {thresholds['avg']:.1f} kg/are")
            print(f"Poor:      < {thresholds['avg']:.1f} kg/are")
            
            # Success criteria
            if grade in ['Good', 'Excellent']:
                print(f"\n🎉 SUCCESS! Optimal conditions now produce '{grade}' grade!")
                print("✅ The 'always Below Average' issue has been FIXED!")
                return True
            else:
                print(f"\n⚠️  Issue persists: Optimal conditions still produce '{grade}' grade")
                print("🔧 May need further model or threshold adjustments")
                return False
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure Flask API is running on localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_optimal_prediction()