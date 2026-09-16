import requests
import json

BASE_URL = 'http://localhost:5000/api'

# Test data
COOPERATIVE_ID = 1

print("="*70)
print("Testing Season Configuration API Endpoints")
print("="*70)

# Test 1: Get all configurations
print("\n1. Testing GET /api/cooperative/season-configs/<cooperative_id>")
response = requests.get(f'{BASE_URL}/cooperative/season-configs/{COOPERATIVE_ID}')
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Success: {data.get('success')}")
    print(f"Number of configurations: {len(data.get('configurations', []))}")
    for config in data.get('configurations', []):
        print(f"  - {config['season_name']} | Active: {config['is_active']} | ID: {config['config_id']}")
else:
    print(f"Error: {response.text}")

# Test 2: Get active configuration only
print("\n2. Testing GET /api/cooperative/season-config/<cooperative_id>")
response = requests.get(f'{BASE_URL}/cooperative/season-config/{COOPERATIVE_ID}')
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Success: {data.get('success')}")
    print(f"Has Config: {data.get('has_config')}")
    if data.get('config'):
        config = data['config']
        print(f"Active Config: {config['season_name']} | {config['crop_type']} | {config['seed_variety']}")
else:
    print(f"Error: {response.text}")

# Test 3: Create new configuration
print("\n3. Testing POST /api/cooperative/season-config")
new_config = {
    'cooperative_id': COOPERATIVE_ID,
    'season_name': '2026 Season C - Test',
    'crop_type': 'Rice',
    'seed_variety': 'Kigoli',
    'fertilizer_type': 'DAP',
    'has_irrigation': True
}
response = requests.post(f'{BASE_URL}/cooperative/season-config', json=new_config)
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Success: {data.get('success')}")
    if data.get('config'):
        print(f"Created Config ID: {data['config'].get('config_id')}")
        created_id = data['config'].get('config_id')
else:
    print(f"Error: {response.text}")
    created_id = None

# Test 4: Delete configuration (if created)
if created_id:
    print(f"\n4. Testing DELETE /api/cooperative/season-config/{created_id}")
    response = requests.delete(f'{BASE_URL}/cooperative/season-config/{created_id}')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data.get('success')}")
        print(f"Message: {data.get('message')}")
    else:
        print(f"Error: {response.text}")

print("\n" + "="*70)
print("Tests Completed!")
print("="*70)
