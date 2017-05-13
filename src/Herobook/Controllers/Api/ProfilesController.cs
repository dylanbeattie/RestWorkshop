using System.Net;
using System.Net.Http;
using System.Web.Http;
using Herobook.Data;
using Herobook.Data.Entities;

namespace Herobook.Controllers.Api {
    public class ProfilesController : ApiController {
        private readonly IDatabase db;

        public ProfilesController() {
            db = new DemoDatabase();
        }

        // GET api/profiles
        public object Get() {
            return db.ListProfiles();
        }

        // GET api/profiles/{username}
        public object Get(string id) {
            return db.FindProfile(id);
        }

        // POST api/profiles
        public object Post([FromBody] Profile profile) {
            var existing = db.FindProfile(profile.Username);
            if (existing == null) {
                db.CreateProfile(profile);
                return Created($"/profiles/{profile.Username}", profile);
            }
            return Request.CreateResponse(HttpStatusCode.Conflict, "That username is not available");
        }

        // PUT api/profiles/{username}
        public object Put(string id, [FromBody] Profile profile) {
            return profile;
        }

        // DELETE api/profiles/{username}
        public void Delete(string id) {
            db.DeleteProfile(id);
        }
    }
}
