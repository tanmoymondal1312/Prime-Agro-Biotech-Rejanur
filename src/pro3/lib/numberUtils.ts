export function numberToBengaliWords(n: number): string {
  if (n === 0) return 'শূন্য';
  
  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
  
  const convertLessThanThousand = (num: number): string => {
    let result = '';
    
    // Hundreds
    if (num >= 100) {
      result += units[Math.floor(num / 100)] + ' শত ';
      num %= 100;
    }
    
    // Tens and Units
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      if (num % 10 > 0) result += units[num % 10] + ' ';
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
    } else if (num > 0) {
      result += units[num] + ' ';
    }
    
    return result.trim();
  };

  let result = '';
  
  // Crores (1,00,00,000)
  if (n >= 10000000) {
    result += convertLessThanThousand(Math.floor(n / 10000000)) + ' কোটি ';
    n %= 10000000;
  }
  
  // Lakhs (1,00,000)
  if (n >= 100000) {
    result += convertLessThanThousand(Math.floor(n / 100000)) + ' লক্ষ ';
    n %= 100000;
  }
  
  // Thousands (1,000)
  if (n >= 1000) {
    result += convertLessThanThousand(Math.floor(n / 1000)) + ' হাজার ';
    n %= 1000;
  }
  
  // Remaining
  if (n > 0) {
    result += convertLessThanThousand(n);
  }
  
  return result.trim() + ' টাকা';
}
