# 上传URL文档

> 上传`URL`类型的文档或网页作为内容填充知识库。

## OpenAPI

````yaml openapi/openapi.json post /llm-application/open/document/upload_url
paths:
  path: /llm-application/open/document/upload_url
  method: post
  servers:
    - url: https://open.bigmodel.cn/api/
      description: 开放平台服务
  request:
    security:
      - title: bearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                使用以下格式进行身份验证：Bearer [<your api
                key>](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              upload_detail:
                allOf:
                  - type: array
                    items:
                      $ref: '#/components/schemas/UrlData'
                    description: url列表
              knowledge_id:
                allOf:
                  - type: string
                    description: 知识库id
            required: true
            refIdentifier: '#/components/schemas/UploadUrlKnowledgeRequest'
            requiredProperties:
              - upload_detail
              - knowledge_id
        examples:
          example:
            value:
              upload_detail:
                - url: <string>
                  knowledge_type: 123
                  custom_separator:
                    - <string>
                  sentence_size: 123
                  callback_url: <string>
                  callback_header: {}
              knowledge_id: <string>
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              data:
                allOf:
                  - type: object
                    properties:
                      successInfos:
                        type: array
                        items:
                          type: object
                          properties:
                            documentId:
                              type: string
                              description: 文档id
                            url:
                              type: string
                              description: url
                      failedInfos:
                        type: array
                        items:
                          type: object
                          properties:
                            url:
                              type: string
                              description: url
                            failReason:
                              type: string
                              description: 失败原因
              code:
                allOf:
                  - type: integer
                    description: 状态码
              message:
                allOf:
                  - type: string
                    description: 返回信息
              timestamp:
                allOf:
                  - type: integer
                    description: 时间戳
            refIdentifier: '#/components/schemas/UploadUrlKnowledgeResponse'
        examples:
          example:
            value:
              data:
                successInfos:
                  - documentId: '122121212'
                    url: xxx.com
                  - documentId: '12121212121'
                    url: xxx.com
                failedInfos:
                  - url: xxx.com
                    failReason: 不支持的文档类型
              code: 200
              message: 请求成功
              timestamp: 1689649504996
        description: 请求成功
    default:
      application/json:
        schemaArray:
          - type: object
            properties:
              code:
                allOf:
                  - type: integer
              message:
                allOf:
                  - type: string
            refIdentifier: '#/components/schemas/LlmApplicationError'
        examples:
          example:
            value:
              code: 123
              message: <string>
        description: 请求失败
  deprecated: false
  type: path
components:
  schemas:
    UrlData:
      type: object
      properties:
        url:
          type: string
          description: url
        knowledge_type:
          type: integer
          description: 文档切片类型
        custom_separator:
          type: array
          items:
            type: string
          description: |
            自定义切片分隔符，仅 knowledge_type=5 时生效，默认
        sentence_size:
          type: integer
          description: 自定义切片字数，仅 knowledge_type=5 时生效，20-2000，默认300
        callback_url:
          type: string
          description: 回调地址
        callback_header:
          type: object
          description: 回调header k-v
      required:
        - url
        - knowledge_type

````