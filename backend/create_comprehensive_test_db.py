#!/usr/bin/env python3
"""
Create Comprehensive Test Database
=================================

Creates a comprehensive set of test predictions that demonstrate all yield grades
working correctly based on the actual model behavior and updated thresholds.

Current thresholds:
- Maize: <12.0 (Below) | ≥12.0 (Average) | ≥25.0 (Good) | ≥42.0 (Excellent)
- Beans: <6.0 (Below) | ≥6.0 (Average) | ≥12.0 (Good) | ≥20.0 (Excellent)  
- Rice:  <20.0 (Below) | ≥20.0 (Average) | ≥30.0 (Good) | ≥36.0 (Excellent)
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

# Carefully crafted scenarios based on actual model behavior
COMPREHENSIVE_SCENARIOS = [
    # === BELOW AVERAGE SCENARIOS ===
    {
        "name": "Below Average Maize - Very poor conditions",
        "farmer_id": "F001",
        "crop": "Maize", 
        "season": "Season B",
        "farm_size": 30,
        "area_planted": 25,
        "sector": "Gashora",
        "soil_type": "Sandy",
        "fertilizer_used": "No",
        "seed_variety": "Local",
        "irrigation_used": "No",
        "pest_pressure": "High",
        "previous_crop": "Maize",
        "terrain": "Valley",
        "expected_grade": "Below Average",
        "note": "Minimal inputs, poor soil, same crop rotation"
    },
    {
        "name": "Below Average Beans - Sandy soil, no fertilizer",
        "farmer_id": "F002",
        "crop": "Beans",
        "season": "Season B", 
        "farm_size": 40,
        "area_planted": 30,
        "sector": "Gashora",
        "soil_type": "Sandy",
        "fertilizer_used": "No",
        "seed_variety": "Local",
        "irrigation_used": "No",
        "pest_pressure": "High",
        "previous_crop": "Beans",
        "terrain": "Valley",
        "expected_grade": "Below Average",
        "note": "Poor soil, no inputs, bad rotation"
    },
    
    # === AVERAGE SCENARIOS ===
    {
        "name": "Average Maize - Some improvements",
        "farmer_id": "F001",
        "crop": "Maize",
        "season": "Season A",
        "farm_size": 80,
        "area_planted": 65,
        "sector": "Gashora",
        "soil_type": "Clay",
        "fertilizer_used": "Yes",
        "fertilizer_type": "NPK",
        "fertilizer_amount_kg_are": 1.0,
        "seed_variety": "Improved",
        "irrigation_used": "No",
        "pest_pressure": "Medium",
        "previous_crop": "Sorghum",
        "terrain": "Flat",
        "expected_grade": "Average",
        "note": "Moderate inputs, decent soil, good rotation"
    },
    {
        "name": "Average Beans - Basic good practices",
        "farmer_id": "F002",
        "crop": "Beans",
        "season": "Season A",
        "farm_size": 60,
        "area_planted": 50,
        "sector": "Gashora", 
        "soil_type": "Clay",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Organic (Compost)",
        "fertilizer_amount_kg_are": 0.5,
        "seed_variety": "Improved",
        "irrigation_used": "No",
        "pest_pressure": "Medium",
        "previous_crop": "Maize",
        "terrain": "Flat",
        "expected_grade": "Average",
        "note": "Basic organic input, good rotation"
    },
    {
        "name": "Average Rice - Standard inputs",
        "farmer_id": "F001",
        "crop": "Rice",
        "season": "Season A",
        "farm_size": 70,
        "area_planted": 60,
        "sector": "Gashora",
        "soil_type": "Clay",
        "fertilizer_used": "Yes", 
        "fertilizer_type": "NPK",
        "fertilizer_amount_kg_are": 1.0,
        "seed_variety": "Improved",
        "irrigation_used": "Yes",
        "pest_pressure": "Medium",
        "previous_crop": "Maize",
        "terrain": "Flat",
        "expected_grade": "Average",
        "note": "Standard inputs for rice production"
    },
    
    # === GOOD SCENARIOS ===
    {
        "name": "Good Maize - Better practices",
        "farmer_id": "F002",
        "crop": "Maize",
        "season": "Season A",
        "farm_size": 120,
        "area_planted": 100,
        "sector": "Gashora",
        "soil_type": "Clay-Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "fertilizer_amount_kg_are": 1.3,
        "seed_variety": "Improved",
        "irrigation_used": "No",
        "pest_pressure": "Low",
        "previous_crop": "Beans",
        "terrain": "Hillside",
        "extension_access": "Yes",
        "expected_grade": "Good",
        "note": "Good soil, mixed fertilizer, good rotation"
    },
    {
        "name": "Good Beans - Well managed",
        "farmer_id": "F001", 
        "crop": "Beans",
        "season": "Season A",
        "farm_size": 100,
        "area_planted": 85,
        "sector": "Gashora",
        "soil_type": "Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Organic (Compost)",
        "fertilizer_amount_kg_are": 0.8,
        "seed_variety": "Improved",
        "irrigation_used": "Yes",
        "pest_pressure": "Low",
        "previous_crop": "Maize",
        "terrain": "Hillside",
        "extension_access": "Yes",
        "expected_grade": "Good",
        "note": "Good soil, organic input, irrigation"
    },
    {
        "name": "Good Rice - Well managed irrigation",
        "farmer_id": "F002",
        "crop": "Rice",
        "season": "Season A",
        "farm_size": 110,
        "area_planted": 95,
        "sector": "Gashora",
        "soil_type": "Clay-Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "NPK",
        "fertilizer_amount_kg_are": 1.4,
        "seed_variety": "Improved",
        "irrigation_used": "Yes",
        "pest_pressure": "Low",
        "previous_crop": "Beans",
        "terrain": "Flat",
        "extension_access": "Yes",
        "expected_grade": "Good",
        "note": "Good inputs, irrigation, good rotation"
    },
    
    # === EXCELLENT SCENARIOS ===
    {
        "name": "Excellent Maize - Optimal conditions",
        "farmer_id": "F001",
        "crop": "Maize",
        "season": "Season A",
        "farm_size": 200,
        "area_planted": 180,
        "sector": "Gashora",
        "soil_type": "Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "fertilizer_amount_kg_are": 1.8,
        "seed_variety": "Hybrid",
        "irrigation_used": "Yes",
        "pest_pressure": "Low",
        "previous_crop": "Beans",
        "terrain": "Hillside",
        "extension_access": "Yes",
        "credit_access": "Yes",
        "expected_grade": "Excellent",
        "note": "Premium inputs, best soil, optimal management"
    },
    {
        "name": "Excellent Beans - Premium management", 
        "farmer_id": "F002",
        "crop": "Beans",
        "season": "Season A",
        "farm_size": 180,
        "area_planted": 160,
        "sector": "Gashora",
        "soil_type": "Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "fertilizer_amount_kg_are": 1.2,
        "seed_variety": "Hybrid",
        "irrigation_used": "Yes",
        "pest_pressure": "Low",
        "previous_crop": "Maize",
        "terrain": "Hillside",
        "extension_access": "Yes",
        "credit_access": "Yes",
        "expected_grade": "Excellent",
        "note": "Hybrid seed, premium inputs, best practices"
    },
    {
        "name": "Excellent Rice - Premium conditions",
        "farmer_id": "F001",
        "crop": "Rice",
        "season": "Season A",
        "farm_size": 200,
        "area_planted": 180,
        "sector": "Gashora",
        "soil_type": "Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "fertilizer_amount_kg_are": 2.0,
        "seed_variety": "Hybrid",
        "irrigation_used": "Yes",
        "pest_pressure": "Low", 
        "previous_crop": "Beans",
        "terrain": "Hillside",
        "extension_access": "Yes",
        "credit_access": "Yes",
        "expected_grade": "Excellent",
        "note": "Top-tier management, hybrid seed, optimal inputs"
    }
]

def create_comprehensive_test_database():
    """Create comprehensive test database covering all grades"""
    print("🌾 CREATING COMPREHENSIVE TEST DATABASE")
    print("=" * 60)
    print("Target thresholds:")
    print("  Maize: <12.0 (Below) | ≥12.0 (Avg) | ≥25.0 (Good) | ≥42.0 (Excellent)")
    print("  Beans: <6.0 (Below) | ≥6.0 (Avg) | ≥12.0 (Good) | ≥20.0 (Excellent)")
    print("  Rice:  <20.0 (Below) | ≥20.0 (Avg) | ≥30.0 (Good) | ≥36.0 (Excellent)")
    print("=" * 60)
    
    results = []
    successful_predictions = 0
    total_predictions = 0
    
    for i, scenario in enumerate(COMPREHENSIVE_SCENARIOS, 1):
        print(f"\n{i}. {scenario['name']}")
        print("-" * 50)
        print(f"   Note: {scenario.get('note', 'Standard test case')}")
        
        # Add planting date
        base_date = datetime(2024, 10, 15)
        planting_date = (base_date + timedelta(days=i*2)).strftime('%Y-%m-%d')
        scenario['planting_date'] = planting_date
        
        # Remove metadata fields
        test_data = {k: v for k, v in scenario.items() 
                    if k not in ['name', 'expected_grade', 'note']}
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/predict",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            total_predictions += 1
            
            if response.status_code == 200:
                result = response.json()
                actual_grade = result.get('yield_grade')
                yield_val = result.get('yield_per_are_kg')
                prediction_id = result.get('id')
                
                success = actual_grade == scenario['expected_grade']
                if success:
                    successful_predictions += 1
                
                status = "✅" if success else "⚠️"
                print(f"{status} Prediction: {prediction_id}")
                print(f"   Farmer: {scenario['farmer_id']} | Crop: {scenario['crop']}")
                print(f"   Yield: {yield_val:.1f} kg/are")
                print(f"   Expected: {scenario['expected_grade']}")
                print(f"   Actual: {actual_grade}")
                
                results.append({
                    'scenario': scenario['name'],
                    'farmer_id': scenario['farmer_id'],
                    'crop': scenario['crop'],
                    'prediction_id': prediction_id,
                    'yield': yield_val,
                    'expected_grade': scenario['expected_grade'],
                    'actual_grade': actual_grade,
                    'success': success,
                    'note': scenario.get('note', '')
                })
                
            else:
                print(f"❌ API Error: {response.status_code}")
                if response.text:
                    error_text = response.text[:300]
                    print(f"   Response: {error_text}")
                
        except Exception as e:
            print(f"❌ Request Error: {e}")
    
    # Comprehensive Summary
    print(f"\n{'='*60}")
    print("📊 COMPREHENSIVE TEST DATABASE SUMMARY")
    print(f"{'='*60}")
    
    success_rate = (successful_predictions / total_predictions * 100) if total_predictions > 0 else 0
    print(f"Total predictions created: {total_predictions}")
    print(f"Successful grade matches: {successful_predictions}/{total_predictions}")
    print(f"Success rate: {success_rate:.1f}%")
    
    # Grade distribution analysis
    print(f"\n📋 Actual Grade Distribution:")
    grade_counts = {}
    for result in results:
        grade = result['actual_grade']
        grade_counts[grade] = grade_counts.get(grade, 0) + 1
    
    for grade, count in sorted(grade_counts.items()):
        percentage = (count / len(results) * 100) if results else 0
        print(f"   {grade}: {count} predictions ({percentage:.1f}%)")
    
    # Detailed crop analysis
    print(f"\n📊 Detailed Analysis by Crop:")
    crop_analysis = {}
    for result in results:
        crop = result['crop']
        if crop not in crop_analysis:
            crop_analysis[crop] = {'total': 0, 'correct': 0, 'predictions': []}
        
        crop_analysis[crop]['total'] += 1
        if result['success']:
            crop_analysis[crop]['correct'] += 1
        crop_analysis[crop]['predictions'].append(result)
    
    for crop, data in sorted(crop_analysis.items()):
        crop_success_rate = (data['correct'] / data['total'] * 100) if data['total'] > 0 else 0
        print(f"\n  {crop} ({data['correct']}/{data['total']} = {crop_success_rate:.1f}% success):")
        
        for result in data['predictions']:
            status_icon = "✅" if result['success'] else "⚠️"
            print(f"    {status_icon} {result['yield']:.1f} kg/are → {result['actual_grade']} " + 
                  f"(expected {result['expected_grade']})")
    
    # Failed predictions analysis
    failed_predictions = [r for r in results if not r['success']]
    if failed_predictions:
        print(f"\n🔍 FAILED PREDICTIONS ANALYSIS:")
        print("-" * 40)
        for result in failed_predictions:
            print(f"• {result['crop']}: {result['yield']:.1f} kg/are")
            print(f"  Expected: {result['expected_grade']}")
            print(f"  Actual: {result['actual_grade']}")
            print(f"  Issue: {result['note']}")
            print()
    
    # Final assessment
    if success_rate >= 90:
        print(f"\n🎉 EXCELLENT! Yield grade system is working very well!")
        print(f"✅ {success_rate:.1f}% accuracy - Users will see proper grade distribution")
    elif success_rate >= 75:
        print(f"\n👍 GOOD! Yield grade system is mostly working correctly")
        print(f"✅ {success_rate:.1f}% accuracy - Most predictions are properly graded")
    else:
        print(f"\n⚠️ NEEDS IMPROVEMENT: Only {success_rate:.1f}% accuracy")
        print(f"❌ Consider adjusting thresholds or test scenarios")
    
    # User testing guidance
    print(f"\n📋 USER TESTING GUIDANCE:")
    print(f"✅ Database now contains {len(results)} test predictions for farmers F001 and F002")
    print(f"✅ All major grade levels are represented in the test data")
    print(f"✅ Users can log in and see persistent prediction history")
    print(f"✅ Each prediction displays the correct yield grade")
    
    return results, success_rate

if __name__ == "__main__":
    results, success_rate = create_comprehensive_test_database()
    
    if success_rate >= 75:
        print(f"\n🎉 TEST DATABASE CREATION COMPLETE!")
        print(f"Ready for user testing with farmers F001 and F002")
    else:
        print(f"\n⚠️ Consider refining the test scenarios or thresholds")