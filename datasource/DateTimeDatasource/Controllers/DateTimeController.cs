using Microsoft.AspNetCore.Mvc;

namespace DateTimeDatasource.Controllers;

[Route("api")]
public class DateTimeController : ControllerBase
{
    [HttpGet]
    [Route("timestamp")]
    public string GetCurrentTimestamp()
    {
        return $"Current timestamp: {DateTime.Now}";
    }
}