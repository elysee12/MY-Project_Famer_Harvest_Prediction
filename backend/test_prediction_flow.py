#!/usr/bin/env python3
"""
Test Complete Prediction Flow
=============================

Test the entire prediction flow from creation to retrieval to identify issues.
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_prediction_flow():
    """Test complete prediction flow"""
    print("🧪 Testing Complete Prediction Flow")
    print("=" * 50)
    
    # Step 1: Test prediction creation
    print("\n1. Testing Prediction Creation")
    print("-" * 30)
    
    prediction_data = {
        "farmer_id": "F002",  # Using F002 to test a different user
        "crop": "Maize",
        "season": "Season A", 
        "farm_size": 150,
        "sector": "Gashora",
        "planting_date": "2024-10-20",
        "area_planted": 120,
        "soil_type": "Clay",
        "fertilizer_used": "Yes",
        "fertilizer_type": "Mixed (Organic + Inorganic)",
        "seed_variety": "Hybrid",
        "irrigation_used": "No",
        "pest_pressure": "Low",
        "previous_crop": "Beans"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json=prediction_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Prediction created successfully")
            print(f"  ID: {result.get('id')}")
            print(f"  Farmer: {result.get('farmer_id')}")
            print(f"  Crop: {result.get('crop')}")
            print(f"  Yield: {result.get('yield_per_are_kg')} kg/are")
            print(f"  Grade: {result.get('yield_grade')}")
            print(f"  Confidence: {result.get('confidence_pct')}%")
            
            prediction_id = result.get('id')
            farmer_id = result.get('farmer_id')
            
        else:
            print(f"❌ Prediction creation failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ Error creating prediction: {e}")
        return
    
    # Step 2: Test prediction retrieval by farmer
    print(f"\n2. Testing Prediction Retrieval for Farmer {farmer_id}")
    print("-" * 30)
    
    try:
        response = requests.get(f"{BASE_URL}/api/predictions?farmer_id={farmer_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                predictions = data.get('predictions', [])
                print(f"✅ Retrieved {len(predictions)} predictions")
                
                # Find our prediction
                found_prediction = None
                for pred in predictions:
                    if pred.get('prediction_id') == prediction_id:
                        found_prediction = pred
                        break
                
                if found_prediction:
                    print(f"✅ Found our prediction in results:")
                    print(f"  ID: {found_prediction.get('prediction_id')}")
                    print(f"  Crop: {found_prediction.get('crop_type')}")  
                    print(f"  Yield: {found_prediction.get('yield_per_are_kg')} kg/are")
                    print(f"  Grade: {found_prediction.get('yield_grade')}")
                    print(f"  Date: {found_prediction.get('created_at')}")
                else:
                    print(f"❌ Our prediction {prediction_id} NOT found in results!")
                    print("Available predictions:")
                    for pred in predictions:
                        print(f"  - {pred.get('prediction_id')} ({pred.get('farmer_id')})")
                        
            else:
                print(f"❌ API returned error: {data.get('error')}")
        else:
            print(f"❌ Retrieval failed: {response.status_code}")
            print(f"  Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error retrieving predictions: {e}")
    
    # Step 3: Test database direct query
    print(f"\n3. Testing Direct Database Query")
    print("-" * 30)
    
    try:
        from database import get_db
        with get_db() as conn:
            with conn.cursor() as cur:
                # Check total predictions
                cur.execute("SELECT COUNT(*) as count FROM predictions")
                total = cur.fetchone()['count']
                print(f"📊 Total predictions in database: {total}")
                
                # Check predictions for our farmer
                cur.execute("SELECT COUNT(*) as count FROM predictions WHERE farmer_id = %s", (farmer_id,))
                farmer_count = cur.fetchone()['count']
                print(f"📊 Predictions for farmer {farmer_id}: {farmer_count}")
                
                # Check recent predictions
                cur.execute("""
                    SELECT prediction_id, farmer_id, crop_type, yield_per_are_kg, yield_grade, created_at 
                    FROM predictions 
                    ORDER BY created_at DESC 
                    LIMIT 5
                """)
                recent = cur.fetchall()
                print(f"\n📊 Recent predictions:")
                for pred in recent:
                    print(f"  {pred['prediction_id']} - {pred['farmer_id']} - {pred['crop_type']} - {pred['yield_per_are_kg']} kg/are - {pred['yield_grade']}")
                
    except Exception as e:
        print(f"❌ Database query error: {e}")
    
    # Step 4: Test different farmer IDs that might be used
    print(f"\n4. Testing Common Farmer IDs")
    print("-" * 30)
    
    test_farmers = ["F001", "F002", "F003", "CL001", "farmer001"]
    
    for test_farmer in test_farmers:
        try:
            response = requests.get(f"{BASE_URL}/api/predictions?farmer_id={test_farmer}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    predictions = data.get('predictions', [])
                    if predictions:
                        print(f"✅ {test_farmer}: {len(predictions)} predictions")
                    else:
                        print(f"➖ {test_farmer}: 0 predictions")
                else:
                    print(f"❌ {test_farmer}: API error - {data.get('error')}")
            else:
                print(f"❌ {test_farmer}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ {test_farmer}: Error - {e}")

if __name__ == "__main__":
    test_prediction_flow()