import math
import struct
import wave
import random

SAMPLE_RATE = 44100

def load_wav(filename):
    with wave.open(filename, 'r') as w:
        frames = w.readframes(w.getnframes())
        num_channels = w.getnchannels()
        samples = struct.unpack(f'<{w.getnframes() * num_channels}h', frames)
        if num_channels == 1:
            return [(s / 32767.0, s / 32767.0) for s in samples]
        else:
            return [(samples[i] / 32767.0, samples[i+1] / 32767.0) for i in range(0, len(samples), 2)]

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

def generate_typing_track_from_real_samples(key_sample, total_duration=26.0):
    total_samples = int(SAMPLE_RATE * total_duration)
    output = [[0.0, 0.0] for _ in range(total_samples)]
    
    # Typing intervals (start_time_seconds, end_time_seconds, approx_characters)
    # Timeline:
    # 1. Voice Scene English Output: 7.16s to 10.5s (170 chars)
    # 2. Text Scene Spanish Input: 11.5s to 13.66s (65 chars)
    # 3. Text Scene English Output: 14.5s to 18.16s (125 chars)
    typing_sections = [
        (7.16, 10.5, 170),
        (11.5, 13.66, 65),
        (14.5, 18.16, 125),
    ]
    
    key_len = len(key_sample)
    
    for start_t, end_t, char_count in typing_sections:
        duration = end_t - start_t
        dt_avg = duration / char_count
        curr_t = start_t
        
        while curr_t < end_t:
            start_idx = int(curr_t * SAMPLE_RATE)
            vol = random.uniform(0.75, 1.0)
            
            for j in range(key_len):
                idx = start_idx + j
                if idx < total_samples:
                    kl, kr = key_sample[j]
                    output[idx][0] += kl * vol * 0.8
                    output[idx][1] += kr * vol * 0.8
                    
            curr_t += random.uniform(dt_avg * 0.8, dt_avg * 1.2)
            
    return output

def generate_ambient_bed(duration=26.0):
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    # Warm cinematic chords
    chords = [
        [146.83, 220.00, 261.63, 329.63, 440.00],  # Dm9
        [174.61, 261.63, 329.63, 392.00, 523.25],  # Fmaj7
        [130.81, 196.00, 246.94, 293.66, 392.00],  # Cmaj9
        [196.00, 293.66, 349.23, 440.00, 587.33],  # Gsus4
    ]
    chord_len = 6.5
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        chord_idx = int((t % (chord_len * 4)) / chord_len)
        chord_t = t % chord_len
        chord = chords[chord_idx]
        
        env = min(1.0, chord_t / 0.8) * max(0.0, 1.0 - (chord_t / (chord_len * 1.1)))
        
        sig_l = 0.0
        sig_r = 0.0
        for idx, freq in enumerate(chord):
            detune = 1.0 + (idx * 0.0015)
            wave_l = math.sin(2 * math.pi * freq * t) + 0.25 * math.sin(2 * math.pi * freq * 2 * t)
            wave_r = math.sin(2 * math.pi * freq * detune * t) + 0.25 * math.sin(2 * math.pi * freq * 2 * detune * t)
            sig_l += wave_l * 0.05
            sig_r += wave_r * 0.05
            
        # Subtle warm kick on beat
        beat_t = t % 0.5
        beat_env = math.exp(-beat_t * 14.0)
        sub_bass = math.sin(2 * math.pi * 50.0 * t) * beat_env * 0.14
        
        out_l = (sig_l * env) + sub_bass
        out_r = (sig_r * env) + sub_bass
        
        master_env = min(1.0, t / 1.5) * min(1.0, (duration - t) / 2.0)
        samples.append((out_l * master_env * 0.6, out_r * master_env * 0.6))
        
    return samples

if __name__ == '__main__':
    base_dir = '/Users/santi/Downloads/n8n-automatizaciones/personal/proyectos/04-voice-to-english-ai/remotion-video/public'
    key_sample = load_wav(f'{base_dir}/key_press.wav')
    
    typing_track = generate_typing_track_from_real_samples(key_sample, 26.0)
    write_wav(f'{base_dir}/typing_sfx.wav', typing_track)
    
    ambient_bed = generate_ambient_bed(26.0)
    write_wav(f'{base_dir}/ambient_track.wav', ambient_bed)
    
    print("Soundtrack and authentic typing track generated successfully!")
