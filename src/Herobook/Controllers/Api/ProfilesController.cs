using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Herobook.Data;
using Herobook.Data.Entities;
using Herobook.Helpers;

namespace Herobook.Controllers.Api {
    public class ProfilesController : ApiController {
        private readonly IDatabase db;

        public ProfilesController() {
            db = new DemoDatabase();
        }

        // GET api/profiles
        public object Get(int index = 0, int count = 10) {
            var _links = Hal.Paginate(Request.RequestUri.AbsolutePath, index, count, db.CountProfiles());
            var items = db.ListProfiles().Skip(index).Take(count).Select(profile => profile.ToResource());
            var _actions = new {
                create = new {
                    name = "Create a new profile",
                    href = Request.RequestUri.AbsolutePath,
                    method = "POST",
                    type = "application/json"
                }
            };
            var result = new {
                _links,
                _actions,
                items
            };
            return result;
        }

        // GET api/profiles/{username}
        public object Get(string id) {
            return (object)db.FindProfile(id)?.ToResource() ?? NotFound();
        }

        // POST api/profiles
        public object Post([FromBody] Profile profile) {
            var existing = db.FindProfile(profile.Username);
            if (existing == null) {
                db.CreateProfile(profile);
                return Created(Url.Content($"~/api/profiles/{profile.Username}"), profile.ToResource());
            }
            return Request.CreateResponse(HttpStatusCode.Conflict, "That username is not available");
        }

        // PUT api/profiles/{username}
        public object Put(string id, [FromBody] Profile profile) {
            var result = db.UpdateProfile(profile);
            return result.ToResource();
        }

        // DELETE api/profiles/{username}
        public void Delete(string id) {
            db.DeleteProfile(id);
        }
    }
}
