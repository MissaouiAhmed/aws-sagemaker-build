var fs=require('fs')
var _=require('lodash')
var Promise=require('bluebird')
var build=require('./build')

module.exports={
    "rollback":{
        Type:"Parallel",
        ResultPath:"$.outputs.rollback",
        Next:"endpointFail",
        Branches:[{
            "StartAt":"shouldDeleteEndpoint",
            "States":{
                "shouldDeleteEndpoint":{
                    Type:"Choice",
                    Choices:[{
                        Or:[{
                            Variable:`$.status.endpoint.EndpointStatus`,
                            StringEquals:"Failed",
                        }],
                        Next:"endpointDelete" 
                    },{
                        Or:[{
                            Variable:`$.status.endpoint.EndpointStatus`,
                            StringEquals:"InService",
                        },{
                            Variable:`$.status.endpoint.EndpointStatus`,
                            StringEquals:"RollingBack",
                        }],
                        Next:`endDelete` 
                    }],
                    Default:`endDelete`
                },
                "endpointDelete":{
                    Type:"Task",
                    Resource:"${StepLambdaDeleteEndpoint.Arn}",
                    ResultPath:"$.status.endpointdelete",
                    Next:"endpointDeleteStatus"
                },
                "endpointDeleteStatus":{
                    Type:"Task",
                    Resource:"${StepLambdaEndpointStatus.Arn}",
                    ResultPath:"$.status.endpoint",
                    Next:"waitForDelete"
                },
                "waitForDelete":{
                    Type:"Wait",
                    Seconds:10,
                    Next:"endpointDeleteCheck"
                },
                "endpointDeleteCheck":{
                    Type:"Choice",
                    Choices:[{
                        Or:[{
                            Variable:`$.status.endpoint.EndpointStatus`,
                            StringEquals:"Deleting",
                        },{
                            Variable:`$.status.endpoint.EndpointStatus`,
                            StringEquals:"Failed",
                        }],
                        Next:"endpointDeleteStatus" 
                    },{
                        Variable:`$.status.endpoint.EndpointStatus`,
                        StringEquals:"Empty",
                        Next:`endDelete` 
                    }],
                    Default:`endDelete`
                },
                "endDelete":{
                    Type:"Pass",
                    End:true
                }
            },
        },{
            "StartAt":"deleteEndpointConfig",
            "States":{
                "deleteEndpointConfig":{
                    Type:"Task",
                    End:true,
                    Resource:"${StepLambdaDeleteEndpointConfig.Arn}",
                    ResultPath:"$.outputs.deleteEndpointConfig",
                }
            }
        },{
            "StartAt":"deleteModel",
            "States":{
                "deleteModel":{
                    Type:"Task",
                    End:true,
                    Resource:"${StepLambdaDeleteModel.Arn}",
                    ResultPath:"$.outputs.deleteModel",
                }
            }
        }]
    }
}


