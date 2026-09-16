#!/usr/bin/env python3
"""
Test with TRULY optimal conditions to see if we can get Good/Excellent grades
"""

import requests
import json

def test_truly_optimal():
    """Test with the best possible conditions"""
    
    url = "http://localhost:5000/api/predict"
    
    # MAXIMUM optimal conditions
    optimal_payload = {
        "farmer_id": "F001",
        "crop": "Maize",
        "sector": "Gashora", 
        "season": "Season A",         # Best season
        "month": "October",           # Best planting month
        "farm_size": 100,             # 1 hectare
        "area_planted": 90,           # 90% utilization
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",  # Best type
        "fertilizer_amount_kg_are": 1.5,  # Optimal amount
        "irrigation_used": "Yes",     # Essential boost
        "seed_variety": "Hybrid",     # Best variety (1.32x multiplier)
        "soil_type": "Loam",          # Best soil (1.05x boost)
        "terrain": "Hillside",        # Best terrain for Maize (1.0x)
        "pest_pressure": "Low",       # Best conditions
        "previous_crop": "Beans",     # Good rotation (+3%)
        "extension_access": "Yes",    # +2% boost
        "labor_availability": "Adequate",
        "credit_access": "Yes",
        "planting_date": "2024-10-15"
    }
    
    print("🌟 TESTING TRULY OPTIMAL CONDITIONS")
    print("=" * 60)
    print("CONDITIONS:")
    for key, value in optimal_payload.items():
        if key not in ["farmer_id", "farm_size", "area_planted"]:
            print(f"  {key}: {value}")
    print("=" * 60)
    
    try:
        response = requests.post(url, json=optimal_payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            yield_per_are = result.get('yield_per_are_kg', 0)
            
            # New realistic thresholds for Maize
            if yield_per_are >= 30.0:
                grade = 'Excellent'
                emoji = '🏆'
                status = '✅ SUCCESS'
            elif yield_per_are >= 24.0:
                grade = 'Good'
                emoji = '⭐'  
                status = '✅ GOOD'
            elif yield_per_are >= 17.0:
                grade = 'Average'
                emoji = '📊'
                status = '⚠️ AVERAGE'
            else:
                grade = 'Below Average'
                emoji = '❌'
                status = '❌ POOR'
            
            print(f"\n📊 OPTIMAL PREDICTION RESULT:")
            print(f"Yield: {yield_per_are:.2f} kg/are")
            print(f"Grade: {emoji} {grade}")
            print(f"Status: {status}")
            print(f"Confidence: {result.get('confidence_pct', 'N/A')}%")
            
            print(f"\n📈 EXPECTED MULTIPLIER EFFECTS:")
            print(f"Base Maize (model): ~17.01 kg/are")
            print(f"+ Hybrid seed: +32% → ~22.5 kg/are")
            print(f"+ Season A: +0% (baseline)")
            print(f"+ Fertilizer: +4-8% → ~24.3 kg/are") 
            print(f"+ Irrigation: +4% → ~25.3 kg/are")
            print(f"+ Loam soil: +5% → ~26.6 kg/are")
            print(f"+ Bean rotation: +3% → ~27.4 kg/are")
            print(f"+ Extension: +2% → ~28.0 kg/are")
            print(f"Expected: ~28+ kg/are")
            print(f"Actual: {yield_per_are:.1f} kg/are")
            
            gap = 28.0 - yield_per_are
            if gap > 0:
                print(f"\n⚠️ YIELD GAP: Missing {gap:.1f} kg/are from expected")
                print("🔧 Possible issues:")
                print("   1. Multipliers not stacking correctly")
                print("   2. Base model prediction too conservative")
                print("   3. Climate factors reducing yield")
                print("   4. Some multipliers not being applied")
            else:
                print(f"\n✅ EXCELLENT: Exceeds expectations!")
            
            return yield_per_are >= 24.0  # Return True if Good or better
            
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_truly_optimal()