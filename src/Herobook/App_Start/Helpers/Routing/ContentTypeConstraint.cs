using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http.Routing;

namespace Herobook.Helpers.Routing {
    // Code from http://massivescale.com/web-api-routing-by-content-type/
    internal class ContentTypeConstraint : IHttpRouteConstraint {
        public ContentTypeConstraint(string allowedMediaType) {
            AllowedMediaType = allowedMediaType;
        }

        public string AllowedMediaType { get; private set; }

        public bool Match(HttpRequestMessage request, IHttpRoute route, string parameterName, IDictionary<string, object> values, HttpRouteDirection routeDirection) {
            if (routeDirection == HttpRouteDirection.UriResolution)
                return (GetMediaHeader(request) == AllowedMediaType);
            else
                return true;
        }

        private string GetMediaHeader(HttpRequestMessage request) {
            IEnumerable<string> headerValues;
            if (request.Content.Headers.TryGetValues("Content-Type", out headerValues) && headerValues.Count() == 1)
                return headerValues.First();
            else
                return "application/x-www-form-urlencoded";
        }
    }
}