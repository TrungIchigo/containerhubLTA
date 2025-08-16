# eDepot API Integration

## Tổng quan

Tài liệu này mô tả việc tích hợp API eDepot vào hệ thống i-ContainerHub theo workflow 3 bước được định nghĩa trong Postman collection.

## Workflow API

### Bước 1: Login
- **Endpoint**: `POST /api/Users/Login`
- **Mục đích**: Xác thực người dùng và lấy token chính
- **Input**: 
  ```json
  {
    "user": "0000000009",
    "password": "123456"
  }
  ```
- **Output**: 
  ```json
  {
    "token": "main-authentication-token"
  }
  ```

### Bước 2: Get Request Token
- **Endpoint**: `GET /api/data/util/gettokenNonAid`
- **Mục đích**: Lấy token tạm thời và thời gian request
- **Headers**: `Authorization: Bearer {main-token}`
- **Input**: 
  ```json
  {
    "reqid": "ViLTA_GetDefaultWallet",
    "data": {
      "appversion": "2023"
    }
  }
  ```
- **Output**: 
  ```json
  {
    "token": "temporary-request-token",
    "reqtime": "2024-01-15T10:30:00Z"
  }
  ```

### Bước 3: Call API Endpoint
- **Endpoint**: `GET /api/data/process/{endpoint}`
- **Mục đích**: Gọi API thực tế với token tạm thời
- **Headers**: `Authorization: Bearer {main-token}`
- **Input**: 
  ```json
  {
    "token": "temporary-request-token",
    "reqtime": "2024-01-15T10:30:00Z",
    "data": {
      "appversion": "2023"
    }
  }
  ```
- **Output**: 
  ```json
  {
    "data": [
      {
        "KhachHang": { "v": "CUSTOMER001" },
        "WalletBalance": { "v": 1000.50 }
      }
    ]
  }
  ```

## Cơ chế Bảo mật

1. **Bearer Token Authentication**: Sử dụng token chính cho xác thực
2. **Temporary Token System**: Token tạm thời với thời gian hết hạn để tránh replay attacks
3. **Request Time Validation**: Kết hợp token với thời gian request để đảm bảo tính fresh

## Implementation

### Files được tạo:

1. **Service Layer**: `src/lib/services/edepot-api.ts`
   - Class `EDepotApiService` implement workflow 3 bước
   - Methods: `login()`, `getRequestToken()`, `callApiEndpoint()`, `executeWorkflow()`
   - Error handling và timeout management

2. **Server Actions**: `src/lib/actions/edepot-api.ts`
   - `executeEDepotApiWorkflow()`: Thực hiện workflow hoàn chỉnh
   - `executeEDepotApiStep()`: Thực hiện từng bước riêng lẻ
   - `testEDepotApiConnection()`: Test kết nối API
   - `getAvailableEDepotEndpoints()`: Lấy danh sách endpoints

3. **Test Page**: `src/app/test-edepot-api/page.tsx`
   - UI để test toàn bộ workflow
   - Tabs cho connection test, complete workflow, individual steps, và configuration
   - Real-time display của kết quả API calls

4. **Unit Tests**: `src/lib/services/edepot-api.test.ts`
   - Comprehensive test coverage cho tất cả methods
   - Mock fetch requests và error scenarios
   - Edge cases và validation tests

## Cách sử dụng Test Page

### Truy cập
Mở trình duyệt và truy cập: `http://localhost:3001/test-edepot-api`

### Các Tab chức năng:

#### 1. Connection Test
- Test kết nối đến eDepot API
- Kiểm tra xem API có accessible không
- Không cần credentials

#### 2. Complete Workflow
- Thực hiện toàn bộ workflow 3 bước trong một lần
- Hiển thị kết quả cuối cùng và tokens được tạo
- Phù hợp cho testing end-to-end

#### 3. Individual Steps
- Test từng bước riêng lẻ
- Step 1: Login để lấy main token
- Step 2: Get request token (cần main token từ Step 1)
- Step 3: Call API (cần tokens từ Step 1 và 2)
- Hiển thị chi tiết response của từng bước

#### 4. Configuration
- Cấu hình credentials (username/password)
- Chọn API endpoint để test
- Thêm additional data (JSON format)
- Danh sách endpoints có sẵn

### Credentials mặc định:
- **Username**: `0000000009`
- **Password**: `123456`
- **Endpoint**: `ViLTA_GetDefaultWallet`

## API Endpoints có sẵn

1. **ViLTA_GetDefaultWallet**: Lấy thông tin ví mặc định
2. **Custom_Endpoint**: Endpoint tùy chỉnh cho testing

## Error Handling

- **Network Errors**: Timeout sau 15 giây
- **Authentication Errors**: Invalid credentials hoặc expired tokens
- **API Errors**: Server errors từ eDepot API
- **Validation Errors**: Missing required fields hoặc invalid data format

## Logging

- Console logs cho từng bước của workflow
- Error logging với chi tiết stack trace
- Response data logging cho debugging

## Testing

Chạy unit tests:
```bash
npm test edepot-api.test.ts
```

Tests cover:
- Happy path scenarios
- Error conditions
- Edge cases
- Network failures
- Invalid responses

## Security Considerations

1. **Credentials**: Không hardcode credentials trong production
2. **Token Storage**: Tokens chỉ tồn tại trong memory, không persist
3. **HTTPS**: Luôn sử dụng HTTPS trong production
4. **Rate Limiting**: Implement rate limiting để tránh abuse
5. **Input Validation**: Validate tất cả input data

## Troubleshooting

### Common Issues:

1. **Connection Failed**
   - Kiểm tra network connectivity
   - Verify API URL đúng
   - Check firewall settings

2. **Authentication Failed**
   - Verify credentials đúng
   - Check account không bị lock
   - Ensure API endpoint accessible

3. **Token Expired**
   - Re-execute login step
   - Check system time synchronization
   - Verify token format

4. **API Call Failed**
   - Ensure all previous steps completed successfully
   - Check endpoint name spelling
   - Verify additional data format

## Future Enhancements

1. **Token Caching**: Cache tokens để tránh re-authentication
2. **Retry Logic**: Automatic retry cho failed requests
3. **More Endpoints**: Thêm support cho các API endpoints khác
4. **Batch Operations**: Support cho multiple API calls
5. **Real-time Monitoring**: Dashboard để monitor API health