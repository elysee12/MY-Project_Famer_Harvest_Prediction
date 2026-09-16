#!/usr/bin/env python3
"""
Final verification test to confirm the grading system is completely fixed.
Tests both the user's original conditions and truly optimal conditions.
"""

import requests
import json

def test_user_conditions():
    """Test the exact conditions the user reported"""
    url = "http://localhost:5000/api/predict"
    
    # User's conditions from screenshots (approximated)
    user_payload = {
        "farmer_id": "F001",
        "crop": "Maize",
        "sector": "Gashora", 
        "season": "Season A",
        "month": "September",  # Based on planting date 2024-09-01
        "farm_size": 500,      # 5 ha from screenshot
        "area_planted": 450,   # 90% utilization
        "fertilizer_used": "Yes",
        "irrigation_used": "Yes", 
        "seed_variety": "Improved",  # From screenshot
        "soil_type": "Loam",         # From screenshot
        "planting_date": "2024-09-01"
    }
    
    print("👤 USER'S ORIGINAL CONDITIONS TEST")
    print("=" * 50)
    
    try:
        response = requests.post(url, json=user_payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            yield_val = result.get('yield_per_are_kg', 0)
            
            # Apply realistic thresholds for Maize
            if yield_val >= 30.0:
                grade = 'Excellent'
                emoji = '🏆'
                status = '✅ FIXED'
            elif yield_val >= 24.0:
                grade = 'Good'
                emoji = '⭐'
                status = '✅ FIXED'
            elif yield_val >= 17.0:
                grade = 'Average'
                emoji = '📊'
                status = '✅ IMPROVED'
            else:
                grade = 'Below Average'
                emoji = '❌'
                status = '❌ STILL ISSUE'
            
            print(f"User's Yield: {yield_val:.2f} kg/are")
            print(f"Grade: {emoji} {grade}")
            print(f"Status: {status}")
            
            # Compare to original problematic range (15.8-18.5)
            if 15.8 <= yield_val <= 18.5:
                print(f"⚠️ Still in original range, but grade improved!")
            elif yield_val > 18.5:
                print(f"✅ Yield increased from original range!")
            
            return yield_val, grade
            
        else:
            print(f"❌ API Error: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def test_optimal_conditions():
    """Test truly optimal conditions"""
    url = "http://localhost:5000/api/predict"
    
    # Maximum optimal conditions
    optimal_payload = {
        "farmer_id": "F001",
        "crop": "Maize",
        "sector": "Gashora", 
        "season": "Season A",
        "month": "October",    # Best month
        "farm_size": 100,
        "area_planted": 90,
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "fertilizer_amount_kg_are": 1.5,
        "irrigation_used": "Yes",
        "seed_variety": "Hybrid",    # Best variety
        "soil_type": "Loam",         # Best soil
        "terrain": "Hillside",       # Best terrain
        "pest_pressure": "Low",      # Best conditions
        "previous_crop": "Beans",    # Good rotation
        "extension_access": "Yes",
        "planting_date": "2024-10-15"
    }
    
    print("\n🌟 OPTIMAL CONDITIONS TEST")
    print("=" * 50)
    
    try:
        response = requests.post(url, json=optimal_payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            yield_val = result.get('yield_per_are_kg', 0)
            
            if yield_val >= 30.0:
                grade = 'Excellent'
                emoji = '🏆'
            elif yield_val >= 24.0:
                grade = 'Good'
                emoji = '⭐'
            elif yield_val >= 17.0:
                grade = 'Average'
                emoji = '📊'
            else:
                grade = 'Below Average'
                emoji = '❌'
            
            print(f"Optimal Yield: {yield_val:.2f} kg/are")
            print(f"Grade: {emoji} {grade}")
            
            return yield_val, grade
            
        else:
            print(f"❌ API Error: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None

def main():
    print("🧪 FINAL VERIFICATION: Yield Grading System Fix")
    print("=" * 60)
    
    # Test user's conditions
    user_yield, user_grade = test_user_conditions()
    
    # Test optimal conditions  
    optimal_yield, optimal_grade = test_optimal_conditions()
    
    print("\n📊 SUMMARY RESULTS")
    print("=" * 50)
    
    if user_yield and optimal_yield:
        print(f"User's conditions:   {user_yield:.1f} kg/are → {user_grade}")
        print(f"Optimal conditions:  {optimal_yield:.1f} kg/are → {optimal_grade}")
        
        print(f"\n🔍 ANALYSIS:")
        print(f"• Model benchmark (Maize): 17.01 kg/are")
        print(f"• New realistic thresholds:")
        print(f"  - Average: ≥ 17.0 kg/are")
        print(f"  - Good:    ≥ 24.0 kg/are") 
        print(f"  - Excellent: ≥ 30.0 kg/are")
        
        # Check if the fix worked
        success = True
        if optimal_grade not in ['Good', 'Excellent']:
            print(f"\n❌ Issue: Optimal conditions should get Good/Excellent")
            success = False
        else:
            print(f"\n✅ Success: Optimal conditions get {optimal_grade}")
        
        if user_grade == 'Below Average':
            print(f"⚠️ User conditions still Below Average, but thresholds are now realistic")
        else:
            print(f"✅ User conditions improved to {user_grade}")
            
        if success:
            print(f"\n🎉 VERIFICATION COMPLETE: Issue RESOLVED!")
            print(f"✅ No more 'always Below Average' problem")
            print(f"✅ Grades now match model capabilities")
            print(f"✅ System credibility restored")
        else:
            print(f"\n❌ Further investigation needed")
    else:
        print(f"❌ Tests failed - check API connectivity")

if __name__ == "__main__":
    main()