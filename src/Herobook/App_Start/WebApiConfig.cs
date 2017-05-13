using System.Web.Http;

namespace Herobook {
    public static class WebApiConfig {
        public static void Register(HttpConfiguration config) {
            // Configure support for sending JSON to regular web browser requests.
            config.Formatters.Add(new BrowserJsonFormatter());

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                "DefaultApi",
                "api/{controller}/{id}",
                new { id = RouteParameter.Optional }
            );
        }
    }
}
