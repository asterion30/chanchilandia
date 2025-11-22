import wave
import math
import struct
import random

def generate_wav(filename, duration, frequency_func, volume=0.5):
    sample_rate = 44100
    n_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(n_samples):
            t = i / sample_rate
            freq = frequency_func(t, duration)
            value = int(volume * 32767.0 * math.sin(2 * math.pi * freq * t))
            data = struct.pack('<h', value)
            wav_file.writeframes(data)

def shoot_freq(t, duration):
    # Frequency drops from 880Hz to 110Hz
    return 880 * (1 - t / duration)

def oinc_freq(t, duration):
    # Low frequency oscillation
    return 150 + 50 * math.sin(2 * math.pi * 20 * t)

if __name__ == "__main__":
    print("Generating music/shoot.wav...")
    generate_wav("music/shoot.wav", 0.2, shoot_freq, volume=0.3)
    
    print("Generating music/oinc.wav...")
    generate_wav("music/oinc.wav", 0.3, oinc_freq, volume=0.4)
    
    print("Done!")
