import type { AddonCategory, Addon, Item, ItemCategory } from '@/types/entities'

export const itemCategories: ItemCategory[] = [
  { id: 1, name: 'Starters', isEnabled: true, userId: 10, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 2, name: 'Main Course', isEnabled: true, userId: 10, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 3, name: 'Breads', isEnabled: true, userId: 10, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 4, name: 'Tiffins', isEnabled: true, userId: 11, createdAt: '2025-11-03T09:00:00Z', updatedAt: '2025-11-03T09:00:00Z' },
  { id: 5, name: 'Beverages', isEnabled: true, userId: 11, createdAt: '2025-11-03T09:00:00Z', updatedAt: '2025-11-03T09:00:00Z' },
  { id: 6, name: 'Classic Pizzas', isEnabled: true, userId: 12, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 7, name: 'Gourmet Pizzas', isEnabled: true, userId: 12, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 8, name: 'Salads', isEnabled: true, userId: 13, createdAt: '2025-11-07T09:00:00Z', updatedAt: '2025-11-07T09:00:00Z' },
  { id: 9, name: 'Smoothie Bowls', isEnabled: true, userId: 13, createdAt: '2025-11-07T09:00:00Z', updatedAt: '2025-11-07T09:00:00Z' },
  { id: 10, name: 'Kebabs', isEnabled: false, userId: 14, createdAt: '2025-11-09T09:00:00Z', updatedAt: '2025-11-09T09:00:00Z' },
]

export const addonCategories: AddonCategory[] = [
  { id: 1, name: 'Spice Level', type: 'single', userId: 10, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 2, name: 'Extra Toppings', type: 'multiple', userId: 12, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 3, name: 'Add Sides', type: 'multiple', userId: 11, createdAt: '2025-11-03T09:00:00Z', updatedAt: '2025-11-03T09:00:00Z' },
  { id: 4, name: 'Portion Size', type: 'single', userId: 13, createdAt: '2025-11-07T09:00:00Z', updatedAt: '2025-11-07T09:00:00Z' },
]

export const addons: Addon[] = [
  { id: 1, name: 'Mild', price: 0, addonCategoryId: 1, userId: 10, isActive: true, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 2, name: 'Medium', price: 0, addonCategoryId: 1, userId: 10, isActive: true, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 3, name: 'Extra Spicy', price: 0, addonCategoryId: 1, userId: 10, isActive: true, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 4, name: 'Extra Cheese', price: 60, addonCategoryId: 2, userId: 12, isActive: true, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 5, name: 'Mushroom', price: 40, addonCategoryId: 2, userId: 12, isActive: true, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 6, name: 'Jalapeno', price: 30, addonCategoryId: 2, userId: 12, isActive: true, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 7, name: 'Sambar', price: 20, addonCategoryId: 3, userId: 11, isActive: true, createdAt: '2025-11-03T09:00:00Z', updatedAt: '2025-11-03T09:00:00Z' },
  { id: 8, name: 'Coconut Chutney', price: 15, addonCategoryId: 3, userId: 11, isActive: true, createdAt: '2025-11-03T09:00:00Z', updatedAt: '2025-11-03T09:00:00Z' },
  { id: 9, name: 'Regular', price: 0, addonCategoryId: 4, userId: 13, isActive: true, createdAt: '2025-11-07T09:00:00Z', updatedAt: '2025-11-07T09:00:00Z' },
  { id: 10, name: 'Large', price: 80, addonCategoryId: 4, userId: 13, isActive: true, createdAt: '2025-11-07T09:00:00Z', updatedAt: '2025-11-07T09:00:00Z' },
]

export const items: Item[] = [
  { id: 1, restaurantId: 1, itemCategoryId: 1, name: 'Paneer Tikka', desc: 'Char-grilled cottage cheese with mint chutney', price: 220, oldPrice: 250, image: '', placeholderImage: '', isRecommended: true, isPopular: true, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [1], createdAt: '2025-11-02T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 2, restaurantId: 1, itemCategoryId: 2, name: 'Butter Chicken', desc: 'Creamy tomato gravy with tandoori chicken', price: 320, oldPrice: null, image: '', placeholderImage: '', isRecommended: true, isPopular: true, isNew: false, isActive: true, isVeg: false, addonCategoryIds: [1], createdAt: '2025-11-02T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 3, restaurantId: 1, itemCategoryId: 2, name: 'Dal Makhani', desc: 'Slow-cooked black lentils with cream', price: 210, oldPrice: null, image: '', placeholderImage: '', isRecommended: false, isPopular: true, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [], createdAt: '2025-11-02T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 4, restaurantId: 1, itemCategoryId: 3, name: 'Butter Naan', desc: 'Tandoor-baked leavened bread', price: 55, oldPrice: null, image: '', placeholderImage: '', isRecommended: false, isPopular: false, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [], createdAt: '2025-11-02T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },

  { id: 5, restaurantId: 2, itemCategoryId: 4, name: 'Masala Dosa', desc: 'Crispy rice crepe with spiced potato filling', price: 90, oldPrice: 100, image: '', placeholderImage: '', isRecommended: true, isPopular: true, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [3], createdAt: '2025-11-03T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 6, restaurantId: 2, itemCategoryId: 4, name: 'Idli Sambar (4pc)', desc: 'Steamed rice cakes with sambar and chutney', price: 70, oldPrice: null, image: '', placeholderImage: '', isRecommended: false, isPopular: true, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [3], createdAt: '2025-11-03T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 7, restaurantId: 2, itemCategoryId: 5, name: 'Filter Coffee', desc: 'South Indian style filter coffee', price: 40, oldPrice: null, image: '', placeholderImage: '', isRecommended: true, isPopular: false, isNew: true, isActive: true, isVeg: true, addonCategoryIds: [], createdAt: '2025-11-03T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },

  { id: 8, restaurantId: 3, itemCategoryId: 6, name: 'Margherita', desc: 'Classic tomato, mozzarella and basil', price: 249, oldPrice: null, image: '', placeholderImage: '', isRecommended: true, isPopular: true, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [2], createdAt: '2025-11-04T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 9, restaurantId: 3, itemCategoryId: 7, name: 'Peri Peri Paneer', desc: 'Spicy peri peri sauce with paneer', price: 349, oldPrice: 399, image: '', placeholderImage: '', isRecommended: true, isPopular: false, isNew: true, isActive: true, isVeg: true, addonCategoryIds: [2], createdAt: '2025-11-04T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 10, restaurantId: 3, itemCategoryId: 6, name: 'Pepperoni', desc: 'Loaded with spicy pepperoni', price: 329, oldPrice: null, image: '', placeholderImage: '', isRecommended: false, isPopular: true, isNew: false, isActive: false, isVeg: false, addonCategoryIds: [2], createdAt: '2025-11-04T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },

  { id: 11, restaurantId: 4, itemCategoryId: 8, name: 'Mediterranean Salad', desc: 'Feta, olives, cucumber, cherry tomato', price: 199, oldPrice: null, image: '', placeholderImage: '', isRecommended: true, isPopular: true, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [4], createdAt: '2025-11-07T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 12, restaurantId: 4, itemCategoryId: 9, name: 'Berry Bliss Bowl', desc: 'Mixed berries, granola, chia seeds', price: 229, oldPrice: 259, image: '', placeholderImage: '', isRecommended: true, isPopular: false, isNew: true, isActive: true, isVeg: true, addonCategoryIds: [4], createdAt: '2025-11-07T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },

  { id: 13, restaurantId: 5, itemCategoryId: 10, name: 'Seekh Kebab', desc: 'Minced mutton skewers, char-grilled', price: 280, oldPrice: null, image: '', placeholderImage: '', isRecommended: true, isPopular: true, isNew: false, isActive: true, isVeg: false, addonCategoryIds: [1], createdAt: '2025-11-09T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
  { id: 14, restaurantId: 6, itemCategoryId: 2, name: 'Veg Hakka Noodles', desc: 'Wok-tossed noodles with vegetables', price: 180, oldPrice: null, image: '', placeholderImage: '', isRecommended: false, isPopular: true, isNew: false, isActive: true, isVeg: true, addonCategoryIds: [], createdAt: '2025-12-01T09:00:00Z', updatedAt: '2026-08-01T09:00:00Z' },
]
