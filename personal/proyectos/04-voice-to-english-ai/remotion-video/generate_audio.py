import math
import struct
import wave
import random

SAMPLE_RATE = 44100

def write_wav(filename, samples):
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(2)  # Stereo
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        
        packed_frames = bytearray()
        for left, right in samples:
            l = max(-32767, min(32767, int(left * 32767)))
            r = max(-32767, min(32767, int(right * 32767)))
            packed_frames.extend(struct.pack('<hh', l, r))
            
        wav_file.writeframes(packed_frames)

def generate_ambient_track(duration=26.0):
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    # Modern synth chords (D min 9 / G maj 9 progression)
    chords = [
        [146.83, 220.00, 261.63, 329.63, 440.00],  # Dm9
        [174.61, 261.63, 329.63, 392.00, 523.25],  # Fmaj7
        [130.81, 196.00, 246.94, 293.66, 392.00],  # Cmaj9
        [196.00, 293.66, 349.23, 440.00, 587.33],  # Gsus4
    ]
    chord_len = 6.5 # seconds per chord
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        chord_idx = int((t % (chord_len * 4)) / chord_len)
        chord_t = t % chord_len
        chord = chords[chord_idx]
        
        # Envelope: soft attack and long decay
        env = min(1.0, chord_t / 0.8) * max(0.0, 1.0 - (chord_t / (chord_len * 1.1)))
        
        # Soft warm pads
        sig_l = 0.0
        sig_r = 0.0
        for idx, freq in enumerate(chord):
            # Detune for lush stereo width
            detune = 1.0 + (idx * 0.0015)
            wave_l = math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * freq * 2 * t)
            wave_r = math.sin(2 * math.pi * freq * detune * t) + 0.3 * math.sin(2 * math.pi * freq * 2 * detune * t)
            sig_l += wave_l * 0.06
            sig_r += wave_r * 0.06
            
        # Subtle sub-bass pulse on beats (every 0.5s = 120 bpm)
        beat_t = t % 0.5
        beat_env = math.exp(-beat_t * 12.0)
        sub_bass = math.sin(2 * math.pi * 55.0 * t) * beat_env * 0.12
        
        # Hi-hat tick (subtle filtered noise every 0.25s)
        tick_t = t % 0.25
        tick_env = math.exp(-tick_t * 40.0)
        tick = (random.random() * 2.0 - 1.0) * tick_env * 0.02
        
        out_l = (sig_l * env) + sub_bass + tick
        out_r = (sig_r * env) + sub_bass + (tick * 0.8)
        
        # Master fade in & out
        master_env = min(1.0, t / 1.5) * min(1.0, (duration - t) / 2.0)
        samples.append((out_l * master_env * 0.7, out_r * master_env * 0.7))
        
    return samples

def generate_chime():
    duration = 1.2
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    # Major 7th chime (C6, E6, G6, B6)
    freqs = [1046.50, 1318.51, 1567.98, 1975.53]
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        sig = 0.0
        for idx, f in enumerate(freqs):
            delay = idx * 0.04
            if t >= delay:
                dt = t - delay
                env = math.exp(-dt * 6.0)
                sig += math.sin(2 * math.pi * f * dt) * env * 0.18
        samples.append((sig, sig))
    return samples

def generate_whoosh():
    duration = 0.6
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (t / duration)) ** 2
        # Sweeping low-pass noise
        f_center = 200 + 800 * (t / duration)
        noise = (random.random() * 2.0 - 1.0)
        sig = noise * math.sin(2 * math.pi * f_center * t) * env * 0.2
        samples.append((sig, sig))
    return samples

def generate_typing_clicks(duration=25.0):
    num_samples = int(SAMPLE_RATE * duration)
    samples = [(0.0, 0.0)] * num_samples
    
    # Generate clicks at realistic typing timings
    # Voice scene typing: 4s to 8s
    # Text scene typing: 11s to 18s
    typing_windows = [(4.5, 8.5), (10.8, 13.0), (14.2, 18.5)]
    
    for start_t, end_t in typing_windows:
        curr_t = start_t
        while curr_t < end_t:
            # Key click burst
            click_duration = 0.02
            click_samples = int(SAMPLE_RATE * click_duration)
            start_idx = int(curr_t * SAMPLE_RATE)
            f_click = random.uniform(1800, 3200)
            
            for j in range(click_samples):
                if start_idx + j < num_samples:
                    ct = j / SAMPLE_RATE
                    env = math.exp(-ct * 250.0)
                    click_sig = math.sin(2 * math.pi * f_click * ct) * env * 0.15
                    l, r = samples[start_idx + j]
                    samples[start_idx + j] = (l + click_sig, r + click_sig * 0.9)
                    
            curr_t += random.uniform(0.06, 0.11)  # Natural typing cadence
            
    return samples

if __name__ == '__main__':
    base_dir = '/Users/santi/Downloads/n8n-automatizaciones/personal/proyectos/04-voice-to-english-ai/remotion-video/public'
    write_wav(f'{base_dir}/ambient_track.wav', generate_ambient_track(26.0))
    write_wav(f'{base_dir}/chime.wav', generate_chime())
    write_wav(f'{base_dir}/whoosh.wav', generate_whoosh())
    write_wav(f'{base_dir}/typing_sfx.wav', generate_typing_clicks(26.0))
    print("Audio assets successfully generated in public/!")
