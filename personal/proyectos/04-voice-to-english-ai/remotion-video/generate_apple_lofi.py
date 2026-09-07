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

def load_wav(filename):
    with wave.open(filename, 'r') as w:
        frames = w.readframes(w.getnframes())
        num_channels = w.getnchannels()
        samples = struct.unpack(f'<{w.getnframes() * num_channels}h', frames)
        if num_channels == 1:
            return [(s / 32767.0, s / 32767.0) for s in samples]
        else:
            return [(samples[i] / 32767.0, samples[i+1] / 32767.0) for i in range(0, len(samples), 2)]

# --- FM Rhodes / Electric Piano Synthesizer ---
def rhodes_note(freq, duration, velocity=0.8):
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    # Carrier + Modulator FM synthesis for classic Fender Rhodes chime
    mod_ratio = 14.0
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Decay envelopes
        env_main = math.exp(-t * 2.2)
        env_mod = math.exp(-t * 8.0) * 1.5
        
        # Vibrato (Lo-Fi wow/flutter)
        vibrato = math.sin(2 * math.pi * 4.5 * t) * 0.003
        f_actual = freq * (1.0 + vibrato)
        
        # FM modulation
        modulator = math.sin(2 * math.pi * f_actual * mod_ratio * t) * env_mod
        carrier = math.sin(2 * math.pi * f_actual * t + modulator) * env_main
        
        # Bell overtone (high tine sound)
        bell = math.sin(2 * math.pi * freq * 4.0 * t) * math.exp(-t * 12.0) * 0.2
        
        sig = (carrier + bell) * velocity * 0.25
        samples.append(sig)
    return samples

# --- Acoustic Pluck / Guitar / Kalimba (Karplus-Strong) ---
def pluck_note(freq, duration, velocity=0.7):
    num_samples = int(SAMPLE_RATE * duration)
    N = int(SAMPLE_RATE / freq)
    if N < 2:
        return [0.0] * num_samples
    buffer = [(random.random() * 2.0 - 1.0) * velocity * 0.2 for _ in range(N)]
    samples = []
    idx = 0
    decay = 0.988
    for _ in range(num_samples):
        val = buffer[idx]
        next_idx = (idx + 1) % N
        buffer[idx] = 0.5 * (buffer[idx] + buffer[next_idx]) * decay
        samples.append(val)
        idx = next_idx
    return samples

def generate_apple_lofi_soundtrack(total_duration=26.0):
    total_samples = int(SAMPLE_RATE * total_duration)
    left_buf = [0.0] * total_samples
    right_buf = [0.0] * total_samples
    
    # 85 BPM Lo-Fi Hip Hop Groove (Beat = 60/85 = 0.7058s)
    beat_dur = 60.0 / 85.0
    bar_dur = beat_dur * 4.0 # 2.8235s per bar
    
    # Sophisticated Neo-Soul / Apple Lo-Fi chord progression (Key: Eb Major / C minor)
    # 1. Fm9 -> 2. Bb13 -> 3. Ebmaj9 -> 4. C7#9
    chord_bars = [
        [174.61, 220.00, 261.63, 311.13, 392.00], # Fm9 (F3, A3, C4, Eb4, G4)
        [233.08, 293.66, 349.23, 440.00, 523.25], # Bb13 (Bb3, D4, F4, A4, C5)
        [155.56, 196.00, 233.08, 293.66, 349.23], # Ebmaj9 (Eb3, G3, Bb3, D4, F4)
        [261.63, 329.63, 392.00, 466.16, 587.33], # C9 (C4, E4, G4, Bb4, D5)
    ]
    
    # Bass frequencies
    bass_notes = [87.31, 116.54, 77.78, 130.81]
    
    # Melodic top hooks
    melody_hooks = [
        (0.0, 523.25), (0.7, 587.33), (1.4, 622.25), (2.1, 523.25),
        (2.8, 466.16), (3.5, 392.00), (4.2, 523.25), (4.9, 440.00),
    ]
    
    # 1. Render Rhodes Chords
    curr_time = 0.0
    bar_idx = 0
    while curr_time < total_duration:
        chord = chord_bars[bar_idx % len(chord_bars)]
        chord_start_idx = int(curr_time * SAMPLE_RATE)
        
        # Strumming effect: arpeggiate slightly across notes
        for n_idx, freq in enumerate(chord):
            strum_delay = n_idx * 0.022
            note_start = int((curr_time + strum_delay) * SAMPLE_RATE)
            note_audio = rhodes_note(freq, 2.7, velocity=0.85)
            
            pan_l = 0.6 + (n_idx * 0.08)
            pan_r = 0.6 - (n_idx * 0.08)
            
            for s_idx, sample_val in enumerate(note_audio):
                pos = note_start + s_idx
                if pos < total_samples:
                    left_buf[pos] += sample_val * pan_l
                    right_buf[pos] += sample_val * pan_r
                    
        curr_time += bar_dur
        bar_idx += 1
        
    # 2. Render Punchy Lo-Fi Beats (Boom-Bap Kick, Snappy Rimshot/Snare, Shaker)
    beat_time = 0.0
    beat_count = 0
    while beat_time < total_duration:
        b_pos = int(beat_time * SAMPLE_RATE)
        beat_in_bar = beat_count % 4
        
        # Kick on Beat 0 and Beat 2.5 (Syncopated boom-bap)
        if beat_in_bar == 0 or beat_in_bar == 2:
            kick_len = int(SAMPLE_RATE * 0.35)
            for j in range(kick_len):
                if b_pos + j < total_samples:
                    t = j / SAMPLE_RATE
                    # Pitch-dropping sine kick (from 120Hz down to 48Hz)
                    freq_k = 48.0 + 80.0 * math.exp(-t * 25.0)
                    k_env = math.exp(-t * 12.0)
                    k_sig = math.sin(2 * math.pi * freq_k * t) * k_env * 0.32
                    # Click transient
                    click = (random.random() * 2.0 - 1.0) * math.exp(-t * 120.0) * 0.1
                    left_buf[b_pos + j] += (k_sig + click)
                    right_buf[b_pos + j] += (k_sig + click)
                    
        # Snare / Rimshot on Beat 1 and Beat 3
        if beat_in_bar == 1 or beat_in_bar == 3:
            snare_len = int(SAMPLE_RATE * 0.22)
            for j in range(snare_len):
                if b_pos + j < total_samples:
                    t = j / SAMPLE_RATE
                    # Body tone (220Hz)
                    body = math.sin(2 * math.pi * 220.0 * t) * math.exp(-t * 22.0) * 0.18
                    # Snappy filtered noise
                    noise = (random.random() * 2.0 - 1.0) * math.exp(-t * 18.0) * 0.18
                    s_sig = (body + noise)
                    left_buf[b_pos + j] += s_sig * 0.95
                    right_buf[b_pos + j] += s_sig * 1.05
                    
        # Crisp Hi-hat / Shaker every 8th note
        for sub_beat in [0.0, 0.5]:
            h_pos = int((beat_time + sub_beat * beat_dur) * SAMPLE_RATE)
            hat_len = int(SAMPLE_RATE * 0.08)
            vol_h = 0.08 if sub_beat == 0.0 else 0.05
            for j in range(hat_len):
                if h_pos + j < total_samples:
                    t = j / SAMPLE_RATE
                    h_noise = (random.random() * 2.0 - 1.0) * math.exp(-t * 55.0) * vol_h
                    left_buf[h_pos + j] += h_noise * 0.8
                    right_buf[h_pos + j] += h_noise * 1.2
                    
        beat_time += beat_dur
        beat_count += 1
        
    # 3. Render Smooth Sub-Bass
    b_time = 0.0
    bar_i = 0
    while b_time < total_duration:
        bass_f = bass_notes[bar_i % len(bass_notes)]
        b_pos = int(b_time * SAMPLE_RATE)
        bass_len = int(SAMPLE_RATE * (bar_dur - 0.1))
        for j in range(bass_len):
            if b_pos + j < total_samples:
                t = j / SAMPLE_RATE
                b_env = min(1.0, t / 0.05) * math.exp(-t * 0.8)
                b_sig = (math.sin(2 * math.pi * bass_f * t) + 0.3 * math.sin(2 * math.pi * bass_f * 2 * t)) * b_env * 0.22
                left_buf[b_pos + j] += b_sig
                right_buf[b_pos + j] += b_sig
        b_time += bar_dur
        bar_i += 1
        
    # 4. Subtle Vinyl Texture
    for i in range(total_samples):
        # Soft crackle
        if random.random() < 0.0015:
            crackle = (random.random() * 2.0 - 1.0) * 0.02
            left_buf[i] += crackle
            right_buf[i] += crackle
            
    # Normalize & Master Fade In/Out
    master_samples = []
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        fade_in = min(1.0, t / 1.2)
        fade_out = min(1.0, (total_duration - t) / 2.0)
        master_gain = fade_in * fade_out * 0.85
        
        l = left_buf[i] * master_gain
        r = right_buf[i] * master_gain
        master_samples.append((l, r))
        
    return master_samples

if __name__ == '__main__':
    base_dir = '/Users/santi/Downloads/n8n-automatizaciones/personal/proyectos/04-voice-to-english-ai/remotion-video/public'
    lofi_track = generate_apple_lofi_soundtrack(26.0)
    write_wav(f'{base_dir}/ambient_track.wav', lofi_track)
    print("Apple Lo-Fi beat generated successfully into public/ambient_track.wav!")
