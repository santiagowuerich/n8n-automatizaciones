import math
import struct
import wave
import random

SAMPLE_RATE = 44100

def write_wav(filename, samples):
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        packed_frames = bytearray()
        for left, right in samples:
            l = max(-32767, min(32767, int(left * 32767)))
            r = max(-32767, min(32767, int(right * 32767)))
            packed_frames.extend(struct.pack('<hh', l, r))
        wav_file.writeframes(packed_frames)

def generate_ai_stream_shimmer(duration=26.0):
    total_samples = int(SAMPLE_RATE * duration)
    output = [[0.0, 0.0] for _ in range(total_samples)]
    
    # Active streaming windows (start_sec, end_sec)
    # 1. Voice Scene English Output: 7.16s to 10.5s (frames 215 to 315)
    # 2. Text Scene Spanish Input: 11.5s to 13.66s (frames 345 to 410)
    # 3. Text Scene English Output: 14.5s to 18.16s (frames 435 to 545)
    stream_windows = [
        (7.16, 10.5),
        (11.5, 13.66),
        (14.5, 18.16),
    ]
    
    for start_t, end_t in stream_windows:
        win_dur = end_t - start_t
        start_sample = int(start_t * SAMPLE_RATE)
        win_samples = int(win_dur * SAMPLE_RATE)
        
        for i in range(win_samples):
            idx = start_sample + i
            if idx >= total_samples:
                break
            t = i / SAMPLE_RATE
            progress = t / win_dur
            
            # Smooth attack and release envelope
            env = min(1.0, t / 0.15) * min(1.0, (win_dur - t) / 0.2)
            
            # Multi-layer ethereal crystalline shimmer (sine sweeps + soft harmonics)
            # High-tech frequency sweep from 1200Hz up to 3400Hz
            sweep_f = 1400.0 + (1200.0 * math.sin(progress * math.pi * 3.0))
            harmonic_1 = math.sin(2 * math.pi * sweep_f * t) * 0.08
            harmonic_2 = math.sin(2 * math.pi * (sweep_f * 1.5) * t) * 0.04
            harmonic_3 = math.sin(2 * math.pi * (sweep_f * 2.0) * t) * 0.02
            
            # Micro data pulses (delicate high-passed digital clicks)
            pulse_t = t % 0.035
            pulse_env = math.exp(-pulse_t * 90.0)
            pulse = math.sin(2 * math.pi * 2800.0 * t) * pulse_env * 0.06
            
            # Stereo pan motion
            pan_l = 0.5 + 0.35 * math.sin(t * 12.0)
            pan_r = 1.0 - pan_l
            
            sig_l = (harmonic_1 + harmonic_2 + harmonic_3 + pulse) * env * pan_l
            sig_r = (harmonic_1 + harmonic_2 + harmonic_3 + pulse) * env * pan_r
            
            output[idx][0] += sig_l * 0.8
            output[idx][1] += sig_r * 0.8
            
    return output

if __name__ == '__main__':
    base_dir = '/Users/santi/Downloads/n8n-automatizaciones/personal/proyectos/04-voice-to-english-ai/remotion-video/public'
    shimmer = generate_ai_stream_shimmer(26.0)
    write_wav(f'{base_dir}/ai_stream.wav', shimmer)
    print("Digital AI stream shimmer generated successfully into public/ai_stream.wav!")
