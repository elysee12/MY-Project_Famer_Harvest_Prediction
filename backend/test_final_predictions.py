#!/usr/bin/env python3
"""
Final Test Predictions for All Grade Levels
==========================================

This script creates comprehensive test predictions to verify the updated yield grade
thresholds are working correctly across all grade levels.
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

# Carefully designed test scenarios to hit each grade level
TEST_SCENARIOS = [
    # BELOW AVERAGE scenarios (poor inputs)
    {
        "name": "Poor Maize - Local seed, no fertilizer, high pest",
        "farmer_id": "F001",
        "crop": "Maize",
        "season": "Season B",
        "farm_size": 50,
        "area_planted": 40,
        "sector": "Gashora",
        "soil_type": "Sandy",
        "fertilizer_used": "No",
        "seed_variety": "Local",
        "irrigation_used": "No",
        "pest_pressure": "High",
        "previous_crop": "Maize",
        "terrain": "Valley",
        "expected_grade": "Below Average"
    },
    {
        "name": "Poor Beans - Sandy soil, no inputs",
        "farmer_id": "F002", 
        "crop": "Beans",
        "season": "Season B",
        "farm_size": 30,
        "area_planted": 25,
        "sector": "Gashora",
        "soil_type": "Sandy",
        "fertilizer_used": "No",
        "seed_variety": "Local",
        "irrigation_used": "No", 
        "pest_pressure": "High",
        "previous_crop": "Beans",
        "terrain": "Valley",
        "expected_grade": "Below Average"
    },
    
    # AVERAGE scenarios (moderate inputs)
    {
        "name": "Average Maize - Clay soil, some fertilizer",
        "farmer_id": "F001",
        "crop": "Maize", 
        "season": "Season A",
        "farm_size": 100,
        "area_planted": 80,
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
        "expected_grade": "Average"
    },
    {
        "name": "Average Rice - Standard inputs",
        "farmer_id": "F002",
        "crop": "Rice",
        "season": "Season A", 
        "farm_size": 80,
        "area_planted": 70,
        "sector": "Gashora",
        "soil_type": "Clay",
        "fertilizer_used": "Yes",
        "fertilizer_type": "NPK", 
        "fertilizer_amount_kg_are": 1.2,
        "seed_variety": "Improved",
        "irrigation_used": "Yes",
        "pest_pressure": "Medium",
        "previous_crop": "Maize",
        "terrain": "Flat",
        "expected_grade": "Average"
    },
    
    # GOOD scenarios (good farmer practices)
    {
        "name": "Good Maize - Hybrid seed, good fertilizer",
        "farmer_id": "F001",
        "crop": "Maize",
        "season": "Season A",
        "farm_size": 150,
        "area_planted": 130,
        "sector": "Gashora", 
        "soil_type": "Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "fertilizer_amount_kg_are": 1.5,
        "seed_variety": "Hybrid",
        "irrigation_used": "Yes",
        "pest_pressure": "Low",
        "previous_crop": "Beans", 
        "terrain": "Hillside",
        "extension_access": "Yes",
        "expected_grade": "Good"
    },
    {
        "name": "Good Beans - Excellent conditions",
        "farmer_id": "F002",
        "crop": "Beans",
        "season": "Season A",
        "farm_size": 120,
        "area_planted": 100, 
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
        "expected_grade": "Good"
    },
    {
        "name": "Good Rice - Well managed farm",
        "farmer_id": "F002",
        "crop": "Rice",
        "season": "Season A",
        "farm_size": 140,
        "area_planted": 120,
        "sector": "Gashora",
        "soil_type": "Clay-Loam",
        "fertilizer_used": "Yes",
        "fertilizer_type": "NPK",
        "fertilizer_amount_kg_are": 1.6,
        "seed_variety": "Hybrid",
        "irrigation_used": "Yes",
        "pest_pressure": "Low",
        "previous_crop": "Beans",
        "terrain": "Hillside",
        "extension_access": "Yes",
        "expected_grade": "Good"
    },
    
    # EXCELLENT scenarios (optimal conditions)
    {
        "name": "Excellent Maize - Perfect conditions",
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
        "expected_grade": "Excellent"
    },
    {
        "name": "Excellent Rice - Optimal setup",
        "farmer_id": "F002",
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
        "expected_grade": "Excellent"
    },
    {
        "name": "Excellent Beans - Top tier management",
        "farmer_id": "F001",
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
        "expected_grade": "Excellent"
    }
]

def create_final_test_predictions():
    """Create final test predictions to verify all grades work correctly"""
    print("🌾 FINAL TEST: Updated Yield Grade Thresholds")
    print("=" * 60)
    print("New Thresholds:")
    print("  Maize: <8.0 (Below) | 8.0-18.0 (Avg) | 18.0-40.0 (Good) | ≥40.0 (Excellent)")
    print("  Beans: <5.0 (Below) | 5.0-10.0 (Avg) | 10.0-18.0 (Good) | ≥18.0 (Excellent)")
    print("  Rice:  <15.0 (Below) | 15.0-25.0 (Avg) | 25.0-33.0 (Good) | ≥33.0 (Excellent)")
    print("=" * 60)
    
    results = []
    
    for i, scenario in enumerate(TEST_SCENARIOS, 1):
        print(f"\n{i}. {scenario['name']}")
        print("-" * 50)
        
        # Add planting date (varied dates)
        base_date = datetime(2024, 10, 1)
        planting_date = (base_date + timedelta(days=i*2)).strftime('%Y-%m-%d')
        scenario['planting_date'] = planting_date
        
        # Remove metadata fields before sending to API
        test_data = {k: v for k, v in scenario.items() 
                    if k not in ['name', 'expected_grade']}
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/predict",
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                actual_grade = result.get('yield_grade')
                yield_val = result.get('yield_per_are_kg')
                prediction_id = result.get('id')
                
                status = "✅" if actual_grade == scenario['expected_grade'] else "⚠️"
                print(f"{status} Prediction: {prediction_id}")
                print(f"   Farmer: {scenario['farmer_id']}")
                print(f"   Crop: {scenario['crop']}")
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
                    'success': actual_grade == scenario['expected_grade']
                })
                
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Request Error: {e}")
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 FINAL TEST SUMMARY")
    print(f"{'='*60}")
    
    total = len(results)
    successful = sum(1 for r in results if r['success'])
    
    print(f"Total predictions created: {total}")
    print(f"Grade matches expected: {successful}/{total}")
    print(f"Success rate: {(successful/total)*100:.1f}%" if total > 0 else "0%")
    
    print(f"\n📋 Grade Distribution:")
    grade_counts = {}
    for result in results:
        grade = result['actual_grade']
        grade_counts[grade] = grade_counts.get(grade, 0) + 1
    
    for grade, count in sorted(grade_counts.items()):
        print(f"   {grade}: {count} predictions")
    
    print(f"\n📝 Results by Crop:")
    crop_results = {}
    for result in results:
        crop = result['crop']
        if crop not in crop_results:
            crop_results[crop] = []
        crop_results[crop].append(result)
    
    for crop, crop_predictions in sorted(crop_results.items()):
        print(f"\n  {crop}:")
        for result in crop_predictions:
            status_icon = "✅" if result['success'] else "⚠️"
            print(f"    {status_icon} {result['yield']:.1f} kg/are → {result['actual_grade']} (expected {result['expected_grade']})")
    
    if successful == total:
        print(f"\n🎉 SUCCESS: All yield grades are working perfectly!")
        print(f"✅ The prediction system now correctly assigns all grade levels.")
        print(f"✅ Users will see proper distribution: Below Average, Average, Good, Excellent")
    else:
        failed = total - successful
        print(f"\n⚠️  {failed} prediction(s) still not matching expected grades.")
        print(f"📋 Failed predictions:")
        for result in results:
            if not result['success']:
                print(f"   • {result['crop']}: {result['yield']:.1f} kg/are → {result['actual_grade']} (expected {result['expected_grade']})")
    
    return results

if __name__ == "__main__":
    results = create_final_test_predictions()