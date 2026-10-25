import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Product = {
  id: string;
  name: string;
  brand: string;
  image: string;
  barcode: string;
  quantity: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const API_URL = 'https://world.openfoodfacts.org/api/v2/search';

const FIELDS =
  'code,product_name,brands,image_front_url,quantity';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCart, setShowCart] = useState(false);

  const loadProducts = useCallback(
    async (term = '') => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          fields: FIELDS,
          page_size: '30',
          page: '1',
          json: '1',
          sort_by: 'unique_scans_n',
        });

        if (term.trim()) {
          params.set('search_terms', term.trim());
        } else {
          params.set('categories_tags_en', 'beverages');
        }

        const response = await fetch(
          `${API_URL}?${params.toString()}`,
          {
            headers: {
              'User-Agent': 'RealStoreMobile/1.0',
            },
          }
        );

        if (!response.ok) {
          throw new Error('تعذر الاتصال بمصدر المنتجات.');
        }

        const data = await response.json();

        const items: Product[] = (data.products || [])
          .filter(
            (item: any) =>
              item.code &&
              item.product_name &&
              item.image_front_url
          )
          .map((item: any) => ({
            id: String(item.code),
            name: String(item.product_name),
            brand: String(item.brands || 'علامة تجارية غير محددة'),
            image: String(item.image_front_url),
            barcode: String(item.code),
            quantity: String(item.quantity || ''),
          }));

        setProducts(items);

        if (items.length === 0) {
          setError('لم نعثر على منتجات مطابقة. جرّب البحث باسم آخر.');
        }
      } catch {
        setError(
          'تعذر تحميل المنتجات. تحقق من اتصال الإنترنت ثم حاول مجدداً.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addToCart = (product: Product) => {
    setCart((previous) => {
      const existing = previous.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return previous.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previous, { product, quantity: 1 }];
    });

    Alert.alert(
      'تمت الإضافة',
      'أُضيف المنتج إلى سلة المشتريات.'
    );
  };

  const changeQuantity = (
    productId: string,
    change: number
  ) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity + change,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((previous) =>
      previous.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="contain"
      />

      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>

      <Text style={styles.brand} numberOfLines={1}>
        {item.brand}
      </Text>

      {!!item.quantity && (
        <Text style={styles.productQuantity}>
          الحجم: {item.quantity}
        </Text>
      )}

      <Text style={styles.priceUnavailable}>
        السعر غير متوفر
      </Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addToCart(item)}
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>
          + أضف للسلة
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = (item: CartItem) => (
    <View key={item.product.id} style={styles.cartItem}>
      <Image
        source={{ uri: item.product.image }}
        style={styles.cartImage}
        resizeMode="contain"
      />

      <View style={styles.cartDetails}>
        <Text style={styles.cartProductName}>
          {item.product.name}
        </Text>

        <Text style={styles.cartPrice}>
          السعر غير محدد
        </Text>

        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              changeQuantity(item.product.id, -1)
            }
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.quantityText}>
            {item.quantity}
          </Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              changeQuantity(item.product.id, 1)
            }
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => removeFromCart(item.product.id)}
          >
            <Text style={styles.removeText}>حذف</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#12372A"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>متجري</Text>
          <Text style={styles.headerSubtitle}>
            منتجات من مصادر بيانات حقيقية
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setShowCart(!showCart)}
        >
          <Text style={styles.cartButtonText}>
            {showCart ? 'المنتجات' : `السلة (${cartCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {showCart ? (
        <View style={styles.cartScreen}>
          <Text style={styles.sectionTitle}>
            سلة المشتريات
          </Text>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartEmoji}>🛒</Text>
              <Text style={styles.emptyCartText}>
                سلتك فارغة حالياً
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.cartList}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {cart.map(renderCartItem)}
              </ScrollView>

              <View style={styles.checkoutNotice}>
                <Text style={styles.checkoutNoticeText}>
                  عدد القطع: {cartCount}
                </Text>

                <Text style={styles.checkoutDescription}>
                  لا يمكن حساب الإجمالي لأن مصدر البيانات
                  لا يوفر أسعار البيع.
                </Text>

                <Text style={styles.checkoutDescription}>
                  إتمام الطلب يتطلب ربط المتجر بمورّد أو
                  متجر يدعم الطلبات والدفع.
                </Text>

                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    Alert.alert(
                      'إفراغ السلة',
                      'هل تريد حذف جميع المنتجات من السلة؟',
                      [
                        {
                          text: 'إلغاء',
                          style: 'cancel',
                        },
                        {
                          text: 'حذف الكل',
                          style: 'destructive',
                          onPress: () => setCart([]),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.clearButtonText}>
                    إفراغ السلة
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.welcomeTitle}>
            اكتشف منتجاتنا
          </Text>

          <Text style={styles.welcomeDescription}>
            ابحث عن المنتجات الغذائية المتاحة في مصدر البيانات.
          </Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن منتج..."
              placeholderTextColor="#89938D"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => loadProducts(search)}
              returnKeyType="search"
            />

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => loadProducts(search)}
            >
              <Text style={styles.searchButtonText}>
                بحث
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              المنتجات
            </Text>

            <TouchableOpacity
              onPress={() => {
                setSearch('');
                loadProducts('');
              }}
            >
              <Text style={styles.refreshText}>
                تحديث
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#176B4D"
              />

              <Text style={styles.loadingText}>
                جارٍ تحميل المنتجات...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadProducts(search)}
              >
                <Text style={styles.retryButtonText}>
                  إعادة المحاولة
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              key="product-grid"
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  لا توجد منتجات لعرضها.
                </Text>
              }
            />
          )}

          <Text style={styles.sourceText}>
            مصدر بيانات المنتجات: Open Food Facts
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },

  header: {
    backgroundColor: '#12372A',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
  },

  headerSubtitle: {
    fontSize: 11,
    color: '#D5E6DB',
    marginTop: 4,
    textAlign: 'left',
  },

  cartButton: {
    backgroundColor: '#DDF4E5',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },

  cartButtonText: {
    color: '#12372A',
    fontWeight: 'bold',
    fontSize: 13,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#183B2E',
    textAlign: 'right',
  },

  welcomeDescription: {
    color: '#718078',
    marginTop: 7,
    marginBottom: 18,
    fontSize: 13,
    textAlign: 'right',
  },

  searchContainer: {
    flexDirection: 'row',
    marginBottom: 22,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E7E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: 'right',
    color: '#183B2E',
  },

  searchButton: {
    backgroundColor: '#176B4D',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#183B2E',
    textAlign: 'right',
  },

  refreshText: {
    color: '#176B4D',
    fontWeight: 'bold',
  },

  productList: {
    paddingBottom: 15,
  },

  productRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  productCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8EEE9',
  },

  productImage: {
    width: '100%',
    height: 125,
    backgroundColor: '#FAFCFA',
    borderRadius: 10,
    marginBottom: 10,
  },

  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#24382E',
    textAlign: 'right',
    minHeight: 38,
  },

  brand: {
    color: '#78857D',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'right',
  },

  productQuantity: {
    color: '#78857D',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'right',
  },

  priceUnavailable: {
    color: '#A16B24',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 10,
    textAlign: 'right',
  },

  addButton: {
    backgroundColor: '#176B4D',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#718078',
  },

  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  errorText: {
    color: '#B42318',
    textAlign: 'center',
    lineHeight: 24,
  },

  retryButton: {
    backgroundColor: '#176B4D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  emptyText: {
    textAlign: 'center',
    color: '#718078',
    marginTop: 30,
  },

  sourceText: {
    color: '#89938D',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 8,
  },

  cartScreen: {
    flex: 1,
    padding: 16,
  },

  cartList: {
    flex: 1,
    marginTop: 15,
  },

  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EEE9',
  },

  cartImage: {
    width: 85,
    height: 95,
  },

  cartDetails: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },

  cartProductName: {
    color: '#183B2E',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  cartPrice: {
    color: '#A16B24',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E4F3E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonText: {
    color: '#176B4D',
    fontSize: 20,
    fontWeight: 'bold',
  },

  quantityText: {
    color: '#183B2E',
    fontWeight: 'bold',
  },

  removeText: {
    color: '#C62828',
    fontWeight: 'bold',
    marginLeft: 4,
  },

  checkoutNotice: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 10,
  },

  checkoutNoticeText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#183B2E',
    textAlign: 'right',
  },

  checkoutDescription: {
    fontSize: 12,
    color: '#68766D',
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 8,
  },

  clearButton: {
    backgroundColor: '#FCE8E8',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },

  clearButtonText: {
    color: '#B42318',
    fontWeight: 'bold',
  },

  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCartEmoji: {
    fontSize: 48,
  },

  emptyCartText: {
    color: '#718078',
    fontSize: 16,
    marginTop: 12,
  },
});