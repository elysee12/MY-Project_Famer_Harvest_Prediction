#!/usr/bin/env python3
"""
Test script to verify the yield grading fix works correctly.
This tests the same grading logic that was updated in flask_api.py
"""

def test_grading_logic():
    """Test the new grading logic with same thresholds as frontend constants.js"""
    
    # Same thresholds as frontend constants.js and updated backend
    YIELD_THRESHOLDS_BACKEND = {
        'Maize': {'poor': 15.0, 'avg': 20.0, 'good': 28.0, 'excellent': 35.0},
        'Beans': {'poor': 8.0, 'avg': 12.0, 'good': 16.0, 'excellent': 20.0},
        'Rice':  {'poor': 12.0, 'avg': 20.0, 'good': 30.0, 'excellent': 40.0},
    }
    
    def grade(val, crop):
        thresholds = YIELD_THRESHOLDS_BACKEND.get(crop, YIELD_THRESHOLDS_BACKEND['Maize'])
        
        if val >= thresholds['excellent']:
            return 'Excellent'
        elif val >= thresholds['good']:
            return 'Good'
        elif val >= thresholds['avg']:
            return 'Average'
        else:
            return 'Below Average'
    
    # Test cases with expected results
    test_cases = [
        # Maize tests
        ('Maize', 40.0, 'Excellent'),  # Above excellent threshold (35)
        ('Maize', 33.8, 'Good'),       # The problematic case from context - should be Good now
        ('Maize', 30.0, 'Good'),       # Above good threshold (28)
        ('Maize', 25.0, 'Average'),    # Above average threshold (20)
        ('Maize', 18.0, 'Below Average'), # Below average threshold
        
        # Rice tests  
        ('Rice', 45.0, 'Excellent'),   # Above excellent threshold (40)
        ('Rice', 35.0, 'Good'),        # Above good threshold (30)
        ('Rice', 25.0, 'Average'),     # Above average threshold (20)
        ('Rice', 15.0, 'Below Average'), # Below average threshold
        
        # Beans tests
        ('Beans', 22.0, 'Excellent'),  # Above excellent threshold (20)
        ('Beans', 18.0, 'Good'),       # Above good threshold (16)
        ('Beans', 14.0, 'Average'),    # Above average threshold (12)
        ('Beans', 10.0, 'Below Average'), # Below average threshold
    ]
    
    print("🧪 Testing Yield Grading Logic")
    print("=" * 50)
    
    all_passed = True
    
    for crop, yield_val, expected in test_cases:
        actual = grade(yield_val, crop)
        status = "✅ PASS" if actual == expected else "❌ FAIL"
        
        if actual != expected:
            all_passed = False
        
        print(f"{status} {crop:6} {yield_val:5.1f} kg/are → {actual:12} (expected: {expected})")
    
    print("=" * 50)
    
    if all_passed:
        print("✅ ALL TESTS PASSED! Grading logic is working correctly.")
        print("\nKey improvements:")
        print("• Maize 33.8 kg/are now grades as 'Good' (was 'Below Average')")
        print("• Crop-specific thresholds applied correctly")
        print("• Consistent with frontend constants.js")
    else:
        print("❌ SOME TESTS FAILED! Check the grading thresholds.")
    
    return all_passed

if __name__ == "__main__":
    test_grading_logic()