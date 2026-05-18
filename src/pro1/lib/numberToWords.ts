
export const numberToBanglaWords = (number: number | string): string => {
  const n = typeof number === 'string' ? parseFloat(number) : number;
  if (isNaN(n)) return '';
  if (n === 0) return 'শূন্য';

  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];

  const convertLessThanHundred = (num: number): string => {
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    const unitDigit = num % 10;
    const tensDigit = Math.floor(num / 10);
    
    // special cases for 21-99 in Bangla are complex, but for simplicity in financial apps:
    const banglaNumbers: Record<number, string> = {
      21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'াতাশ', 28: 'আটাশ', 29: 'উনত্রিশ',
      31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ',
      41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ',
      51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট',
      61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর',
      71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'ঊনআশি',
      81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টাশি', 89: 'উননব্বই',
      91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
    };

    if (banglaNumbers[num]) return banglaNumbers[num];
    return tens[tensDigit] + (unitDigit > 0 ? units[unitDigit] : '');
  };

  const convert = (num: number): string => {
    if (num === 0) return '';
    
    let result = '';
    
    if (Math.floor(num / 10000000) > 0) {
      result += convert(Math.floor(num / 10000000)) + ' কোটি ';
      num %= 10000000;
    }
    
    if (Math.floor(num / 100000) > 0) {
      result += convertLessThanHundred(Math.floor(num / 100000)) + ' লাখ ';
      num %= 100000;
    }
    
    if (Math.floor(num / 1000) > 0) {
      result += convertLessThanHundred(Math.floor(num / 1000)) + ' হাজার ';
      num %= 1000;
    }
    
    if (Math.floor(num / 100) > 0) {
      result += convertLessThanHundred(Math.floor(num / 100)) + 'শত ';
      num %= 100;
    }
    
    if (num > 0) {
      result += convertLessThanHundred(num);
    }
    
    return result.trim();
  };

  const integerPart = Math.floor(n);
  const fractionalPart = Math.round((n - integerPart) * 100);

  let output = convert(integerPart) + ' টাকা';
  if (fractionalPart > 0) {
    output += ' ' + convertLessThanHundred(fractionalPart) + ' পয়সা';
  }
  
  return output + ' মাত্র';
};
