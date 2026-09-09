const express = require('express');
const cors = require('cors');
const { PhoneNumberUtil, PhoneNumberFormat, PhoneNumberType } = require('google-libphonenumber');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const phoneUtil = PhoneNumberUtil.getInstance();

const AREA_CODES_AR = {
  '362': 'Resistencia / Chaco',
  '379': 'Corrientes Capital',
  '370': 'Formosa Capital',
  '376': 'Posadas / Misiones',
  '3755': 'Oberá / Misiones',
  '3777': 'Goya / Corrientes',
  '3735': 'Villa Ángela / Chaco',
  '364': 'Sáenz Peña / Chaco',
  '3772': 'Paso de los Libres / Corrientes',
  '3773': 'Mercedes / Corrientes',
  '11': 'Buenos Aires / AMBA',
  '351': 'Córdoba Capital',
  '341': 'Rosario / Santa Fe',
  '261': 'Mendoza Capital',
  '381': 'San Miguel de Tucumán',
  '387': 'Salta Capital',
  '221': 'La Plata / Buenos Aires',
  '223': 'Mar del Plata / Buenos Aires'
};

function getLineTypeString(typeNum) {
  switch (typeNum) {
    case PhoneNumberType.FIXED_LINE:
      return 'FIXED_LINE';
    case PhoneNumberType.MOBILE:
      return 'MOBILE';
    case PhoneNumberType.FIXED_LINE_OR_MOBILE:
      return 'FIXED_LINE_OR_MOBILE';
    case PhoneNumberType.TOLL_FREE:
      return 'TOLL_FREE';
    case PhoneNumberType.PREMIUM_RATE:
      return 'PREMIUM_RATE';
    case PhoneNumberType.SHARED_COST:
      return 'SHARED_COST';
    case PhoneNumberType.VOIP:
      return 'VOIP';
    case PhoneNumberType.PERSONAL_NUMBER:
      return 'PERSONAL_NUMBER';
    case PhoneNumberType.PAGER:
      return 'PAGER';
    case PhoneNumberType.UAN:
      return 'UAN';
    case PhoneNumberType.VOICEMAIL:
      return 'VOICEMAIL';
    default:
      return 'UNKNOWN';
  }
}

function detectLocation(numberE164, countryCode) {
  if (countryCode === 'AR') {
    // E164 format: +5493624123456 or +543624123456
    const clean = numberE164.replace(/^\+54(9)?/, '');
    for (const [code, loc] of Object.entries(AREA_CODES_AR)) {
      if (clean.startsWith(code)) {
        return loc;
      }
    }
  }
  return '';
}

function validatePhoneNumber(rawNumber, defaultCountry = 'AR') {
  if (!rawNumber || typeof rawNumber !== 'string') {
    return {
      valid: false,
      raw_number: rawNumber || '',
      error: 'Empty or invalid input'
    };
  }

  let cleaned = rawNumber.trim();
  
  // Si viene con 15 en Argentina (ej. 3624151234 o +54 9 362 15-41234) normalizar
  // Si empieza con 54 sin +, agregar +
  if (/^54[0-9]+/.test(cleaned) && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  try {
    const number = phoneUtil.parseAndKeepRawInput(cleaned, defaultCountry.toUpperCase());
    const isValid = phoneUtil.isValidNumber(number);
    const isPossible = phoneUtil.isPossibleNumber(number);
    
    if (!isPossible) {
      return {
        valid: false,
        raw_number: rawNumber,
        error: 'Number is impossible for given region'
      };
    }

    const typeNum = phoneUtil.getNumberType(number);
    const lineType = getLineTypeString(typeNum);
    const countryCode = phoneUtil.getRegionCodeForNumber(number) || defaultCountry.toUpperCase();
    const e164 = phoneUtil.format(number, PhoneNumberFormat.E164);
    const international = phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL);
    const national = phoneUtil.format(number, PhoneNumberFormat.NATIONAL);
    const countryPrefix = '+' + number.getCountryCode();

    // Determinar si es apto para WhatsApp (Móvil / Posible Móvil)
    // En Argentina muchos fijos se marcan como FIXED_LINE_OR_MOBILE si no tienen el 9,
    // pero si tiene +549 es garantizado Móvil.
    //
    // OJO: FIXED_LINE_OR_MOBILE NO se puede aceptar a ciegas. En Chile
    // libphonenumber devuelve ese tipo para casi todos los numeros, fijos
    // incluidos, asi que aceptarlo dejaba pasar fijos de Iquique (+5657...) y
    // Antofagasta (+5655...) como si fueran celulares de WhatsApp.
    // Regla real por pais: el celular chileno es +56 9 + 8 digitos.
    const REGLAS_MOVIL_POR_PAIS = {
      AR: (n) => n.startsWith('+549'),
      // +56 (3) + 9 (1) + 8 digitos = 12 caracteres. Un fijo tambien mide 12
      // (+5657... , +5655...), por eso el prefijo +569 es lo que discrimina.
      CL: (n) => n.startsWith('+569') && n.length === 12
    };
    const reglaPais = REGLAS_MOVIL_POR_PAIS[countryCode];
    const isMobile = reglaPais
      ? reglaPais(e164)
      : (lineType === 'MOBILE' || lineType === 'FIXED_LINE_OR_MOBILE');

    const location = detectLocation(e164, countryCode);

    return {
      valid: isValid,
      possible: isPossible,
      raw_number: rawNumber,
      e164: e164,
      whatsapp_format: e164.replace('+', ''),
      international_format: international,
      national_format: national,
      country_prefix: countryPrefix,
      country_code: countryCode,
      line_type: lineType,
      is_mobile: isMobile,
      location: location
    };
  } catch (err) {
    return {
      valid: false,
      raw_number: rawNumber,
      error: err.message
    };
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'numvalidate-api', timestamp: new Date().toISOString() });
});

app.get('/validate', (req, res) => {
  const { number, country = 'AR' } = req.query;
  if (!number) {
    return res.status(400).json({ error: 'Query parameter "number" is required' });
  }
  const result = validatePhoneNumber(number, country);
  res.json(result);
});

app.post('/validate', (req, res) => {
  const { number, country = 'AR' } = req.body;
  if (!number) {
    return res.status(400).json({ error: 'Body parameter "number" is required' });
  }
  const result = validatePhoneNumber(number, country);
  res.json(result);
});

app.post('/validate-batch', (req, res) => {
  const { numbers, country = 'AR', items, filter_invalid = false, filter_non_mobile = false } = req.body;
  
  // Soporta array directo de strings o array de objetos (e.g. leads)
  if (Array.isArray(numbers)) {
    let results = numbers.map(num => validatePhoneNumber(num, country));
    if (filter_invalid) {
      results = results.filter(r => r.valid);
    }
    if (filter_non_mobile) {
      results = results.filter(r => r.is_mobile);
    }
    return res.json({
      total: numbers.length,
      processed: results.length,
      results: results
    });
  }

  if (Array.isArray(items)) {
    // Si mandan un array de items/leads con { telefono: "..." }
    let processedItems = items.map(item => {
      const phoneKey = Object.keys(item).find(k => /tel|phone|cel|whatsapp/i.test(k)) || 'telefono';
      const raw = item[phoneKey] || '';
      const validation = validatePhoneNumber(raw, country);
      return {
        ...item,
        _validation: validation,
        telefono_normalizado: validation.e164 || raw,
        es_valido: validation.valid,
        es_celular: validation.is_mobile
      };
    });

    if (filter_invalid) {
      processedItems = processedItems.filter(i => i.es_valido);
    }
    if (filter_non_mobile) {
      processedItems = processedItems.filter(i => i.es_celular);
    }

    return res.json({
      total: items.length,
      processed: processedItems.length,
      items: processedItems
    });
  }

  return res.status(400).json({ error: 'Expected "numbers" or "items" array in request body' });
});

// Solo levanta el servidor si se ejecuta directo (node index.js).
// Al hacer require() desde otro script, se exporta la validacion como
// libreria: misma logica, sin depender de que el servicio este arriba.
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NumValidate API running on port ${PORT}`);
  });
}

module.exports = { validatePhoneNumber, app };
